import { create } from 'zustand';
import { passwordSecurity, encryption, inputValidation, tokenSecurity, rateLimiting } from './security';
import { useAuthStore } from './authStore';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
}

interface UserAuthStore {
  currentUser: User | null;
  users: User[];
  register: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  requestPasswordReset: (email: string) => { success: boolean; resetToken?: string; error?: string };
  resetPassword: (email: string, resetToken: string, newPassword: string) => Promise<boolean>;
  changePassword: (email: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  restoreSession: () => boolean; // Restore user session from localStorage if valid
}

// Load from localStorage
const loadUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('users');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const loadCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('current-user');
    const sessionTimestamp = localStorage.getItem('user-session-timestamp');
    
    if (!stored) return null;
    
    // CRITICAL SECURITY: Validate session timestamp
    // Sessions expire after 24 hours of inactivity
    if (sessionTimestamp) {
      const timestamp = parseInt(sessionTimestamp, 10);
      const now = Date.now();
      const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
      
      if (isNaN(timestamp) || (now - timestamp) > SESSION_DURATION) {
        // Session expired, clear it
        localStorage.removeItem('current-user');
        localStorage.removeItem('user-session-timestamp');
        return null;
      }
    } else {
      // No timestamp means old session format, clear it for security
      localStorage.removeItem('current-user');
      return null;
    }
    
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const saveUsers = (users: User[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('users', JSON.stringify(users));
  } catch (error) {
    console.error('Failed to save users:', error);
  }
};

const saveCurrentUser = (user: User | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem('current-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('current-user');
    }
  } catch (error) {
    console.error('Failed to save current user:', error);
  }
};

// Store password hashes securely (encrypted)
const loadPasswordHashes = (): { [email: string]: string } => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('user-password-hashes');
    if (!stored) {
      // Check for old format (plain text passwords) for migration
      const oldPasswords = localStorage.getItem('user-passwords');
      if (oldPasswords) {
        try {
          const passwords = JSON.parse(oldPasswords);
          // Migrate old passwords - hash them and store securely
          const hashes: { [email: string]: string } = {};
          // Note: We can't hash old plain passwords without the original password
          // User will need to reset password or re-register
          console.warn('Old password format detected. Users need to reset passwords.');
          return {};
        } catch {
          return {};
        }
      }
      return {};
    }
    // Try to decrypt the stored hashes
    try {
      const decrypted = encryption.decrypt(stored);
      return JSON.parse(decrypted);
    } catch (decryptError) {
      // If decryption fails, try parsing as plain JSON (for development)
      console.warn('Decryption failed, trying plain JSON:', decryptError);
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
  } catch {
    return {};
  }
};

const savePasswordHashes = (hashes: { [email: string]: string }) => {
  if (typeof window === 'undefined') return;
  try {
    // Try to encrypt password hashes before storing
    try {
      const encrypted = encryption.encrypt(JSON.stringify(hashes));
      localStorage.setItem('user-password-hashes', encrypted);
    } catch (encryptError) {
      // If encryption fails (e.g., no encryption key), store as plain JSON
      console.warn('Encryption failed, storing as plain JSON:', encryptError);
      localStorage.setItem('user-password-hashes', JSON.stringify(hashes));
    }
  } catch (error) {
    console.error('Failed to save password hashes:', error);
  }
};

// Store password reset tokens (in production, use proper token management)
const loadResetTokens = (): { [email: string]: { token: string; expiresAt: string } } => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('reset-tokens');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveResetTokens = (tokens: { [email: string]: { token: string; expiresAt: string } }) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('reset-tokens', JSON.stringify(tokens));
  } catch (error) {
    // Silently fail - reset tokens are not critical
    // Error is already handled by the function return value
  }
};

export const useUserAuthStore = create<UserAuthStore>((set, get) => {
  const initialUsers = loadUsers();
  // CRITICAL SECURITY: Don't auto-load user from localStorage on initialization
  // This prevents auto-login when URL is shared or opened in new tab
  // Users must explicitly log in through the login page
  const initialCurrentUser = null;
  
  return {
    currentUser: initialCurrentUser,
    users: initialUsers,
    
    register: async (email, password, firstName, lastName, phone) => {
      // Rate limiting
      if (!rateLimiting.checkLimit(`register_${email}`, 5, 15 * 60 * 1000)) {
        return { success: false, error: 'Too many registration attempts. Please try again later.' };
      }

      // Validate inputs
      const emailValidation = inputValidation.validateEmail(email);
      if (!emailValidation.valid) {
        return { success: false, error: 'Invalid email address' };
      }

      const firstNameValidation = inputValidation.validateName(firstName);
      if (!firstNameValidation.valid) {
        return { success: false, error: 'Invalid first name' };
      }

      const lastNameValidation = inputValidation.validateName(lastName);
      if (!lastNameValidation.valid) {
        return { success: false, error: 'Invalid last name' };
      }

      // Validate password strength
      const passwordValidation = passwordSecurity.validateStrength(password);
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.errors.join('. ') };
      }

      const users = get().users;
      
      // Check if user already exists
      if (users.some(u => u.email.toLowerCase() === emailValidation.sanitized)) {
        return { success: false, error: 'An account with this email already exists' };
      }
      
      // Hash password securely
      const passwordHash = await passwordSecurity.hash(password);
      
      const newUser: User = {
        id: `USER-${Date.now()}-${tokenSecurity.generateToken(9).toUpperCase()}`,
        email: emailValidation.sanitized,
        firstName: firstNameValidation.sanitized,
        lastName: lastNameValidation.sanitized,
        phone: phone ? inputValidation.validatePhone(phone).sanitized : undefined,
        createdAt: new Date().toISOString(),
      };
      
      const updatedUsers = [...users, newUser];
      set({ users: updatedUsers });
      saveUsers(updatedUsers);
      
      // Save password hash (encrypted)
      const passwordHashes = loadPasswordHashes();
      passwordHashes[emailValidation.sanitized] = passwordHash;
      savePasswordHashes(passwordHashes);
      
      // Clear seller auth when buyer registers/logs in (buyers should never see seller options)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('seller-auth');
      }
      
      // Auto-login after registration
      set({ currentUser: newUser });
      saveCurrentUser(newUser);
      // CRITICAL SECURITY: Set session timestamp on registration
      if (typeof window !== 'undefined') {
        localStorage.setItem('user-session-timestamp', Date.now().toString());
      }
      
      rateLimiting.resetLimit(`register_${email}`);
      return { success: true };
    },
    
    login: async (email, password) => {
      // Rate limiting (max 5 attempts per 15 minutes)
      const rateLimitKey = `login_${email.toLowerCase()}`;
      if (!rateLimiting.checkLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
        return { success: false, error: 'Too many login attempts. Please try again in 15 minutes.' };
      }

      // Validate email
      const emailValidation = inputValidation.validateEmail(email);
      if (!emailValidation.valid) {
        return { success: false, error: 'Invalid email address' };
      }

      const users = get().users;
      const passwordHashes = loadPasswordHashes();
      
      const user = users.find(u => u.email.toLowerCase() === emailValidation.sanitized);
      
      if (!user) {
        return { success: false, error: 'Invalid email or password' }; // Don't reveal if user exists
      }
      
      const storedHash = passwordHashes[emailValidation.sanitized];
      if (!storedHash) {
        // Check for old password format (for migration)
        const oldPasswords = localStorage.getItem('user-passwords');
        if (oldPasswords) {
          try {
            const passwords = JSON.parse(oldPasswords);
            const oldPassword = passwords[emailValidation.sanitized];
            if (oldPassword === password) {
              // Old password matches - migrate to new format
              const newHash = await passwordSecurity.hash(password);
              passwordHashes[emailValidation.sanitized] = newHash;
              savePasswordHashes(passwordHashes);
              
              // Clear seller auth when buyer logs in (buyers should never see seller options)
              if (typeof window !== 'undefined') {
                localStorage.removeItem('seller-auth');
              }
              
              set({ currentUser: user });
              saveCurrentUser(user);
              rateLimiting.resetLimit(rateLimitKey);
              return { success: true };
            }
          } catch {
            // Ignore parse errors
          }
        }
        return { success: false, error: 'Invalid email or password. If you registered before, please use "Forgot Password" to reset.' };
      }

      // Verify password hash
      const isValid = await passwordSecurity.verify(password, storedHash);
      
      if (!isValid) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      // Clear seller auth when buyer logs in (buyers should never see seller options)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('seller-auth');
        
        // CRITICAL SECURITY: Set session timestamp on login
        localStorage.setItem('user-session-timestamp', Date.now().toString());
        
        // CRITICAL SECURITY FIX: Clear previous user's data when new user logs in
        // This prevents user A from seeing user B's data
        const previousUser = loadCurrentUser();
        if (previousUser && previousUser.email !== user.email) {
          // Clear all user-specific data from previous user
          console.log('Clearing previous user data for security');
          
          // Clear orders (will be filtered by email, but clear to be safe)
          try {
            const ordersData = localStorage.getItem('orders');
            if (ordersData) {
              const allOrders = JSON.parse(ordersData);
              if (Array.isArray(allOrders)) {
                const filteredOrders = allOrders.filter((order: any) => 
                  order.shippingAddress?.email?.toLowerCase() !== previousUser.email.toLowerCase()
                );
                localStorage.setItem('orders', JSON.stringify(filteredOrders));
              }
            }
          } catch (e) {
            console.error('Error clearing orders:', e);
            // If corrupted, just remove it
            localStorage.removeItem('orders');
          }
          
          // Clear saved addresses
          try {
            const addressesData = localStorage.getItem('saved-addresses');
            if (addressesData) {
              const parsed = JSON.parse(addressesData);
              // Handle Zustand persist format: { state: { savedAddresses: [...] } }
              const allAddresses = parsed?.state?.savedAddresses || (Array.isArray(parsed) ? parsed : []);
              if (Array.isArray(allAddresses)) {
                const filteredAddresses = allAddresses.filter((addr: any) => 
                  addr.userEmail?.toLowerCase() !== previousUser.email.toLowerCase()
                );
                // Save back in Zustand format if it was in that format
                if (parsed?.state) {
                  localStorage.setItem('saved-addresses', JSON.stringify({
                    ...parsed,
                    state: {
                      ...parsed.state,
                      savedAddresses: filteredAddresses
                    }
                  }));
                } else {
                  localStorage.setItem('saved-addresses', JSON.stringify(filteredAddresses));
                }
              }
            }
          } catch (e) {
            console.error('Error clearing addresses:', e);
            // If corrupted, just remove it
            localStorage.removeItem('saved-addresses');
          }
          
          // Clear cart (optional, but good practice)
          localStorage.removeItem('cart');
        }
      }
      
      set({ currentUser: user });
      saveCurrentUser(user);
      // CRITICAL SECURITY: Update session timestamp on successful login
      if (typeof window !== 'undefined') {
        localStorage.setItem('user-session-timestamp', Date.now().toString());
      }
      rateLimiting.resetLimit(rateLimitKey);
      return { success: true };
    },
    
    logout: () => {
      const currentUser = get().currentUser;
      
      // CRITICAL SECURITY FIX: Clear all user-specific data on logout
      if (typeof window !== 'undefined') {
        // Clear session timestamp
        localStorage.removeItem('user-session-timestamp');
        
        if (currentUser) {
          // Clear orders for this user
          try {
            const ordersData = localStorage.getItem('orders');
            if (ordersData) {
              const allOrders = JSON.parse(ordersData);
              if (Array.isArray(allOrders)) {
                const filteredOrders = allOrders.filter((order: any) => 
                  order.shippingAddress?.email?.toLowerCase() !== currentUser.email.toLowerCase()
                );
                localStorage.setItem('orders', JSON.stringify(filteredOrders));
              }
            }
          } catch (e) {
            console.error('Error clearing orders on logout:', e);
            localStorage.removeItem('orders');
          }
          
          // Clear saved addresses for this user
          try {
            const addressesData = localStorage.getItem('saved-addresses');
            if (addressesData) {
              const parsed = JSON.parse(addressesData);
              // Handle Zustand persist format: { state: { savedAddresses: [...] } }
              const allAddresses = parsed?.state?.savedAddresses || (Array.isArray(parsed) ? parsed : []);
              if (Array.isArray(allAddresses)) {
                const filteredAddresses = allAddresses.filter((addr: any) => 
                  addr.userEmail?.toLowerCase() !== currentUser.email.toLowerCase()
                );
                // Save back in Zustand format if it was in that format
                if (parsed?.state) {
                  localStorage.setItem('saved-addresses', JSON.stringify({
                    ...parsed,
                    state: {
                      ...parsed.state,
                      savedAddresses: filteredAddresses
                    }
                  }));
                } else {
                  localStorage.setItem('saved-addresses', JSON.stringify(filteredAddresses));
                }
              }
            }
          } catch (e) {
            console.error('Error clearing addresses on logout:', e);
            localStorage.removeItem('saved-addresses');
          }
          
          // Clear cart
          localStorage.removeItem('cart');
        }
      }
      
      set({ currentUser: null });
      saveCurrentUser(null);
      // Note: We don't clear seller-auth here because seller logout is handled separately
      // This ensures buyers and sellers can have separate sessions
    },
    
    updateProfile: (updates) => {
      const currentUser = get().currentUser;
      if (!currentUser) return;
      
      const updatedUser = { ...currentUser, ...updates };
      const updatedUsers = get().users.map(u =>
        u.id === currentUser.id ? updatedUser : u
      );
      
      set({ currentUser: updatedUser, users: updatedUsers });
      saveCurrentUser(updatedUser);
      saveUsers(updatedUsers);
    },
    
    requestPasswordReset: (email) => {
      // Rate limiting
      if (!rateLimiting.checkLimit(`reset_${email.toLowerCase()}`, 3, 60 * 60 * 1000)) {
        return { success: false, error: 'Too many reset requests. Please try again later.' };
      }

      // Validate email
      const emailValidation = inputValidation.validateEmail(email);
      if (!emailValidation.valid) {
        return { success: false, error: 'Invalid email address' };
      }

      const users = get().users;
      const user = users.find(u => u.email.toLowerCase() === emailValidation.sanitized);
      
      if (!user) {
        // Don't reveal if user exists (security best practice)
        return { success: false, error: 'If an account exists with this email, a reset link has been sent.' };
      }
      
      // Generate secure reset token
      const resetToken = tokenSecurity.generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
      
      const tokens = loadResetTokens();
      tokens[emailValidation.sanitized] = { token: resetToken, expiresAt };
      saveResetTokens(tokens);
      
      // In production, send email with reset link
      // For demo purposes, we'll return the token
      return { success: true, resetToken };
    },
    
    resetPassword: async (email, resetToken, newPassword) => {
      // Validate inputs
      const emailValidation = inputValidation.validateEmail(email);
      if (!emailValidation.valid) {
        return false;
      }

      // Validate password strength
      const passwordValidation = passwordSecurity.validateStrength(newPassword);
      if (!passwordValidation.valid) {
        return false;
      }

      const users = get().users;
      const user = users.find(u => u.email.toLowerCase() === emailValidation.sanitized);
      
      if (!user) {
        return false;
      }
      
      const tokens = loadResetTokens();
      const tokenData = tokens[emailValidation.sanitized];
      
      if (!tokenData || tokenData.token !== resetToken) {
        return false; // Invalid token
      }
      
      if (new Date(tokenData.expiresAt) < new Date()) {
        delete tokens[emailValidation.sanitized];
        saveResetTokens(tokens);
        return false; // Token expired
      }
      
      // Hash and update password
      const passwordHash = await passwordSecurity.hash(newPassword);
      const passwordHashes = loadPasswordHashes();
      passwordHashes[emailValidation.sanitized] = passwordHash;
      savePasswordHashes(passwordHashes);
      
      // Remove used token
      delete tokens[emailValidation.sanitized];
      saveResetTokens(tokens);
      
      return true;
    },
    
    changePassword: async (email, currentPassword, newPassword) => {
      // Validate password strength
      const passwordValidation = passwordSecurity.validateStrength(newPassword);
      if (!passwordValidation.valid) {
        return false;
      }

      const passwordHashes = loadPasswordHashes();
      const storedHash = passwordHashes[email.toLowerCase()];
      
      if (!storedHash) {
        return false;
      }

      // Verify current password
      const isValid = await passwordSecurity.verify(currentPassword, storedHash);
      if (!isValid) {
        return false; // Current password incorrect
      }
      
      // Hash and save new password
      const newHash = await passwordSecurity.hash(newPassword);
      passwordHashes[email.toLowerCase()] = newHash;
      savePasswordHashes(passwordHashes);
      
      return true;
    },
    
    restoreSession: () => {
      // Only restore session if there's a valid session in localStorage
      const user = loadCurrentUser();
      if (user) {
        // Validate session timestamp
        const sessionTimestamp = localStorage.getItem('user-session-timestamp');
        if (sessionTimestamp) {
          const timestamp = parseInt(sessionTimestamp, 10);
          const now = Date.now();
          const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
          
          if (!isNaN(timestamp) && (now - timestamp) <= SESSION_DURATION) {
            // Valid session, restore user
            set({ currentUser: user });
            // Update session timestamp to extend session
            localStorage.setItem('user-session-timestamp', Date.now().toString());
            return true;
          }
        }
      }
      return false;
    },
  };
});


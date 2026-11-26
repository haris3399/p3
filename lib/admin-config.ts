// ============================================================================
// RSVP + ADMIN MODULE — single config file (client-safe: NO secrets here).
// Naye wedding site me sirf yeh file edit karni hoti hai.
// ============================================================================
export const adminConfig = {
  coupleNames: 'Charlotte & William',   // admin header me dikhta hai
  adminTitle: 'RSVP responses',          // dashboard heading
  loginTitle: 'RSVP Admin',              // login page heading
  maxGuests: 4,                          // server kabhi isse zyada guests accept nahi karta
  // Form ke "ATTENDING" select ki values bilkul yahi keys hain.
  events: { both: 'Both', ceremony: 'Ceremony only', reception: 'Reception only' },
} as const

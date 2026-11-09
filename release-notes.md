The Passkey Proxy now has separate password and Passkey switches. It rejects unsafe settings that would disable both methods or leave a Passkey-only account without a registered credential for its configured origin.

The LAN Proxy settings separate access addresses, sign-in methods, and credential management. A blank reverse proxy IP list trusts only loopback; remote peers can be identified from the settings page and must be approved explicitly. Existing configurations keep their current methods on upgrade.

The Mobile Layout package is unchanged and can still be installed independently. The README explains LAN HTTP, HTTPS, installation, and rollback.

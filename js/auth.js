window.RL = window.RL || {};

RL.auth = {
  async getSession() {
    if (!window.rlClient) return null;
    const { data, error } = await window.rlClient.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async signUp(email, password) {
    const { data, error } = await window.rlClient.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async signIn(email, password) {
    const { data, error } = await window.rlClient.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await window.rlClient.auth.signOut();
    if (error) throw error;
  },

  onAuthStateChange(callback) {
    if (!window.rlClient) return { data: { subscription: { unsubscribe() {} } } };
    return window.rlClient.auth.onAuthStateChange(callback);
  }
};

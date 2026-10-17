window.RL = window.RL || {};

function client() {
  if (!window.rlClient) throw new Error("Supabase is not configured.");
  return window.rlClient;
}

async function requireUserId() {
  const { data, error } = await client().auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not signed in.");
  return data.user.id;
}

function mapKeywordRow(row, logs, tagIds) {
  return {
    id: row.id,
    keyword: row.keyword,
    domain: row.domain,
    engine: row.engine,
    notes: row.notes || "",
    created_at: row.created_at,
    tagIds: tagIds || [],
    history: (logs || []).map((l) => ({
      id: l.id,
      date: l.logged_on,
      position: l.position
    }))
  };
}

RL.db = {
  async listKeywordsWithLogs() {
    const c = client();
    const [{ data: keywords, error: kErr }, { data: logs, error: lErr }, { data: links, error: tErr }] =
      await Promise.all([
        c.from("keywords").select("*").order("created_at", { ascending: false }),
        c.from("rank_logs").select("*").order("logged_on", { ascending: true }),
        c.from("keyword_tags").select("keyword_id, tag_id")
      ]);
    if (kErr) throw kErr;
    if (lErr) throw lErr;
    if (tErr) throw tErr;

    const logsByKw = {};
    (logs || []).forEach((l) => {
      if (!logsByKw[l.keyword_id]) logsByKw[l.keyword_id] = [];
      logsByKw[l.keyword_id].push(l);
    });
    const tagsByKw = {};
    (links || []).forEach((link) => {
      if (!tagsByKw[link.keyword_id]) tagsByKw[link.keyword_id] = [];
      tagsByKw[link.keyword_id].push(link.tag_id);
    });

    return (keywords || []).map((row) =>
      mapKeywordRow(row, logsByKw[row.id], tagsByKw[row.id])
    );
  },

  async createKeyword({ keyword, domain, engine, position, date, notes, tagIds }) {
    const userId = await requireUserId();
    const c = client();
    const { data: row, error } = await c
      .from("keywords")
      .insert({
        user_id: userId,
        keyword,
        domain,
        engine: engine || "Google",
        notes: notes || ""
      })
      .select("*")
      .single();
    if (error) throw error;

    const { data: log, error: logErr } = await c
      .from("rank_logs")
      .insert({
        user_id: userId,
        keyword_id: row.id,
        logged_on: date || RL.todayISO(),
        position: Number(position)
      })
      .select("*")
      .single();
    if (logErr) throw logErr;

    if (tagIds && tagIds.length) {
      const rows = tagIds.map((tag_id) => ({
        user_id: userId,
        keyword_id: row.id,
        tag_id
      }));
      const { error: linkErr } = await c.from("keyword_tags").insert(rows);
      if (linkErr) throw linkErr;
    }

    return mapKeywordRow(row, [log], tagIds || []);
  },

  async addRankLog(keywordId, position, date) {
    const userId = await requireUserId();
    const { data, error } = await client()
      .from("rank_logs")
      .insert({
        user_id: userId,
        keyword_id: keywordId,
        logged_on: date || RL.todayISO(),
        position: Number(position)
      })
      .select("*")
      .single();
    if (error) throw error;
    return { id: data.id, date: data.logged_on, position: data.position };
  },

  async updateKeywordNotes(id, notes) {
    const { error } = await client()
      .from("keywords")
      .update({ notes: notes || "" })
      .eq("id", id);
    if (error) throw error;
  },

  async deleteKeyword(id) {
    const { error } = await client().from("keywords").delete().eq("id", id);
    if (error) throw error;
  },

  async listTags() {
    const { data, error } = await client()
      .from("tags")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createTag(name) {
    const userId = await requireUserId();
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Tag name is required.");
    const { data, error } = await client()
      .from("tags")
      .insert({ user_id: userId, name: trimmed })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async setKeywordTags(keywordId, tagIds) {
    const userId = await requireUserId();
    const c = client();
    const { error: delErr } = await c
      .from("keyword_tags")
      .delete()
      .eq("keyword_id", keywordId);
    if (delErr) throw delErr;
    if (!tagIds || !tagIds.length) return;
    const rows = tagIds.map((tag_id) => ({
      user_id: userId,
      keyword_id: keywordId,
      tag_id
    }));
    const { error } = await c.from("keyword_tags").insert(rows);
    if (error) throw error;
  }
};

import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/suggest', async (req, res) => {
  const { kernwert } = req.body as { kernwert: string };

  if (!kernwert?.trim()) {
    res.status(400).json({ error: 'Kernwert fehlt' });
    return;
  }

  const payload = {
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Du bist Experte für das Werte- und Entwicklungsquadrat nach Friedemann Schulz von Thun.
Jeder positive Kernwert braucht eine Schwestertugend. Wird er übertrieben, entartet er.
Beispiel: {"schwestertugend":"Großzügigkeit","entartungKernwert":"Geiz","entartungSchwestertugend":"Verschwendung","beschreibung":"Das Gleichgewicht zwischen Sparen und Geben"}
Antworte NUR mit JSON: {schwestertugend, entartungKernwert, entartungSchwestertugend, beschreibung}.`,
      },
      {
        role: 'user',
        content: `Kernwert: "${kernwert}"`,
      },
    ],
  };

  console.log(`[API] Anfrage für Kernwert: "${kernwert}"`);

  const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).catch((err: Error) => {
    console.error('[FETCH FEHLER]', err.message);
    return null;
  });

  if (!apiRes) {
    res.status(500).json({ error: 'Netzwerkfehler beim KI-Aufruf' });
    return;
  }

  const data = await apiRes.json().catch((e: Error) => {
    console.error('[JSON FEHLER]', e.message);
    return null;
  });

  if (!data) {
    res.status(500).json({ error: 'Antwort konnte nicht gelesen werden' });
    return;
  }

  if (!apiRes.ok) {
    console.error('[OPENAI FEHLER]', data?.error?.message);
    res.status(500).json({ error: data?.error?.message ?? 'OpenAI Fehler' });
    return;
  }

  const text = data.choices?.[0]?.message?.content ?? '';
  console.log(`[API] Antwort:`, text.slice(0, 100));

  try {
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch {
    console.error('[PARSE FEHLER] Inhalt:', text);
    res.status(500).json({ error: 'JSON-Parsing fehlgeschlagen' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend läuft auf http://localhost:${PORT}`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY fehlt!');
  }
});

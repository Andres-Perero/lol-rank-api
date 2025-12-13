// api/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch"; 
import { getAccount, getRank } from "../src/riot.js";

dotenv.config();

const app = express();
app.use(cors());

app.get("/rank", async (req, res) => {
  try {
    const { gameName, tagLine, region, widget } = req.query;
    if (!gameName || !tagLine || !region) return res.status(400).send("Faltan parámetros");

    const account = await getAccount(gameName, tagLine, region);
    const ranks = await getRank(account.puuid, region);

    const solo = ranks.find(r => r.queueType === "RANKED_SOLO_5x5") || {
      tier: "UNRANKED", rank: "", leaguePoints: 0, wins: 0, losses: 0
    };

    const nick = `${account.gameName}#${account.tagLine}`;
    const tier = solo.tier === "UNRANKED" ? "Unranked" : `${solo.tier} ${solo.rank}`;
    const result = `${nick} ${region.toUpperCase()} • ${tier} (${solo.leaguePoints}LPs) • W ${solo.wins} | L ${solo.losses}`;

    if (widget === 'true') {
      res.type("html").send(`
    <html>
      <body style="background:transparent;color:white;font-size:140px;text-align:center;display:flex;justify-content:center;align-items:center;height:100%;">
        <div id="wl">W ${solo.wins} | L ${solo.losses}</div>

        <script>
          setInterval(() => location.reload(), 600000);
        </script>
      </body>
    </html>
  `);
      return;
    }
    else {
      res.type("text").send(result);
    }

  } catch (e) {
    res.status(500).send("Error: " + e.message);
  }
});

app.get("/partido", async (req, res) => {
  const user = req.query.user;

  try {
    const r = await fetch(`https://soloboom.net/api/streaming/${user}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "application/json, text/plain, */*"
      }
    });

    const raw = await r.text();

    // Si devuelve HTML, lo detectamos
    if (raw.trim().startsWith("<")) {
      console.log("Desde Vercel devuelven HTML, no JSON:", raw.slice(0, 200));
      return res
        .status(500)
        .send("El servidor externo bloqueó la petición desde Vercel.");
    }

    const data = JSON.parse(raw);

    res.type("text").send(data.message);

  } catch (e) {
    console.log("ERROR:", e);
    res.status(500).json({ error: "El jugador no está jugando" });
  }
});


app.get("/today-widget", async (req, res) => {
  const regionalRouting = { BR: "americas", NA: "americas", LAN: "americas", LAS: "americas", EUW: "europe", EUNE: "europe", KR: "asia", TR: "europe", RU: "europe", JP: "asia", OCE: "americas" };

  const { gameName, tagLine, region } = req.query;
  if (!gameName || !tagLine || !region) return res.sendStatus(400);

  const rr = regionalRouting[region.toUpperCase()];
  if (!rr) return res.status(400).send("Región inválida");

  const account = await getAccount(gameName, tagLine, region);

  const startOfDay = Math.floor(
    new Date().setHours(0,0,0,0) / 1000
  );

  const ids = await fetch(
    `https://${rr}.api.riotgames.com/lol/match/v5/matches/by-puuid/${account.puuid}/ids?startTime=${startOfDay}&count=20`,
    { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
  ).then(r => r.json());

  let wins = 0, losses = 0;

  for (const id of ids) {
    const match = await fetch(
      `https://${rr}.api.riotgames.com/lol/match/v5/matches/${id}`,
      { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
    ).then(r => r.json());

    const p = match.info.participants.find(p => p.puuid === account.puuid);
    p?.win ? wins++ : losses++;
    console.log(p?.win)
  }

  res.type("html").send(`
    <html>
      <body style="
        background:transparent;
        color:white;
        font-size:140px;
        display:flex;
        justify-content:center;
        align-items:center;
        height:100%;
      ">
        <div>W ${wins} | L ${losses}</div>
        <script>setTimeout(() => location.reload(), 600000)</script>
      </body>
    </html>
  `);
});


app.get("/today-widget", async (req, res) => {
  //https://tu-dominio/api/today-widget?gameName=XXX&tagLine=YYY&region=region
  const regionalRouting = { BR: "americas", NA: "americas", LAN: "americas", LAS: "americas", EUW: "europe", EUNE: "europe", KR: "asia", TR: "europe", RU: "europe", JP: "asia", OCE: "americas" };

  const { gameName, tagLine, region } = req.query;
  if (!gameName || !tagLine || !region) return res.sendStatus(400);

  const rr = regionalRouting[region.toUpperCase()];
  if (!rr) return res.status(400).send("Región inválida");

  const account = await getAccount(gameName, tagLine, region);

  const startOfDay = Math.floor(
    new Date().setHours(0, 0, 0, 0) / 1000
  );

  const ids = await fetch(
    `https://${rr}.api.riotgames.com/lol/match/v5/matches/by-puuid/${account.puuid}/ids?startTime=${startOfDay}&count=20`,
    { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
  ).then(r => r.json());

  let wins = 0, losses = 0;

  for (const id of ids) {
    const match = await fetch(
      `https://${rr}.api.riotgames.com/lol/match/v5/matches/${id}`,
      { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
    ).then(r => r.json());

    const p = match.info.participants.find(p => p.puuid === account.puuid);
    p?.win ? wins++ : losses++;
    console.log(p?.win)
  }

  res.type("html").send(`
    <html>
      <body style="
        background:transparent;
        color:white;
        font-size:140px;
        display:flex;
        justify-content:center;
        align-items:center;
        height:100%;
      ">
        <div>W ${wins} | L ${losses}</div>
        <script>setTimeout(() => location.reload(), 600000)</script>
      </body>
    </html>
  `);
});

app.get("/today-widget-multi", async (req, res) => {
    //http://localhost:3000/today-widget-multi?accounts=acc1%23tag:server,acc2%23tag:server
  //enfasis en el %23 lo lee como #
  const regionalRouting = {
    BR: "americas", NA: "americas", LAN: "americas", LAS: "americas",
    EUW: "europe", EUNE: "europe", KR: "asia", TR: "europe",
    RU: "europe", JP: "asia", OCE: "americas"
  };

  try {
    const { accounts } = req.query;
    if (!accounts) return res.sendStatus(400);

    let wins = 0, losses = 0;

    const startOfDay = Math.floor(
      new Date().setHours(0, 0, 0, 0) / 1000
    );

    const list = accounts.split(",");

    for (const acc of list) {
      try {
        const lastColon = acc.lastIndexOf(":");
        if (lastColon === -1) continue;

        const riotId = acc.slice(0, lastColon);
        const region = acc.slice(lastColon + 1).toUpperCase();

        const [gameName, tagLine] = riotId.split("#");
        if (!gameName || !tagLine) continue;

        const rr = regionalRouting[region];
        if (!rr) continue;

        const account = await getAccount(gameName, tagLine, region);
        if (!account?.puuid) continue;

        const idsRes = await fetch(
          `https://${rr}.api.riotgames.com/lol/match/v5/matches/by-puuid/${account.puuid}/ids?startTime=${startOfDay}&count=20`,
          { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
        );

        if (!idsRes.ok) continue;
        const ids = await idsRes.json();
        if (!Array.isArray(ids)) continue;

        for (const id of ids) {
          try {
            const matchRes = await fetch(
              `https://${rr}.api.riotgames.com/lol/match/v5/matches/${id}`,
              { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
            );

            if (!matchRes.ok) continue;
            const match = await matchRes.json();

            const p = match?.info?.participants?.find(
              p => p.puuid === account.puuid
            );
            if (!p) continue;

            p.win ? wins++ : losses++;
          } catch {
            continue;
          }
        }
      } catch {
        continue;
      }
    }

    res.type("html").send(`
      <html>
        <body style="
          background:transparent;
          color:white;
          font-size:140px;
          display:flex;
          justify-content:center;
          align-items:center;
          height:100%;
        ">
          <div>W ${wins} | L ${losses}</div>
          <script>setTimeout(() => location.reload(), 600000)</script>
        </body>
      </html>
    `);

  } catch (err) {
    console.error("today-widget-multi fatal:", err);
    res.status(500).send("Internal error");
  }
});


export default app;











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
    const { gameName, tagLine, region } = req.query;
    if (!gameName || !tagLine || !region) return res.status(400).send("Faltan parámetros");

    const account = await getAccount(gameName, tagLine, region);
    const ranks = await getRank(account.puuid, region);

    const solo = ranks.find(r => r.queueType === "RANKED_SOLO_5x5") || {
      tier: "UNRANKED", rank: "", leaguePoints: 0, wins: 0, losses: 0
    };

    const nick = `${account.gameName}#${account.tagLine}`;
    const tier = solo.tier === "UNRANKED" ? "Unranked" : `${solo.tier} ${solo.rank}`;
    const result = `${nick} ${region.toUpperCase()} • ${tier} (${solo.leaguePoints}LPs) • W ${solo.wins} | L ${solo.losses}`;

    res.type("text").send(result);

  } catch (e) {
    res.status(500).send("Error: " + e.message);
  }
});


app.get("/game", async (req, res) => {
  const user = req.query.user ;

  try {
    const r = await fetch(`https://soloboom.net/api/streaming/${user}`);
    const data = await r.json();
     res.type("text").send(result); // solo el mensaje limpio
  } catch (e) {
    res.send("El jugador no esta jugando, o no se actualizo aun");
  }
});


export default app;


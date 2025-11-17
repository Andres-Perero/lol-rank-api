import fetch from "node-fetch";

const platformRouting = { BR: "br1", NA: "na1", LAN: "la1", LAS: "la2", EUW: "euw1", EUNE: "eun1", KR: "kr", TR: "tr1", RU: "ru", JP: "jp1", OCE: "oc1" };
const regionalRouting = { BR: "americas", NA: "americas", LAN: "americas", LAS: "americas", EUW: "europe", EUNE: "europe", KR: "asia", TR: "europe", RU: "europe", JP: "asia", OCE: "americas" };

async function riotFetch(url) {
  const res = await fetch(url, {
    headers: { "X-Riot-Token": process.env.RIOT_API_KEY }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Riot error ${res.status}: ${JSON.stringify(err)}`);
  }
  return res.json();
}

export async function getAccount(gameName, tagLine, region) {
  const rr = regionalRouting[region.toUpperCase()];
  if (!rr) throw new Error("Región inválida");
  const url = `https://${rr}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  return riotFetch(url);
}

export async function getSummonerByPUUID(puuid, region) {
  const pr = platformRouting[region.toUpperCase()];
  if (!pr) throw new Error("Región inválida");
  const url = `https://${pr}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  return riotFetch(url);
}

export async function getRank(puuid, region) {
    const pr = platformRouting[region.toUpperCase()];
    if (!pr) throw new Error("Región inválida");
    const url = `https://${pr}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
    console.log(url)
    return riotFetch(url);
  }
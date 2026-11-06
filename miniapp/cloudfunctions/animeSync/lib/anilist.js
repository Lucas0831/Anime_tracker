const { request } = require('./http');

const ENDPOINT = 'https://graphql.anilist.co';

const SEASON_QUERY = `
query ($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { currentPage lastPage hasNextPage total }
    media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
      id
      idMal
      title { native romaji english }
      coverImage { extraLarge large }
      description
      status
      season
      seasonYear
      episodes
      format
      countryOfOrigin
      source
      genres
      averageScore
      popularity
      isAdult
      startDate { year month day }
      endDate { year month day }
      studios { nodes { name } }
      nextAiringEpisode { episode airingAt }
    }
  }
}`;

const SCHEDULE_QUERY = `
query ($from: Int, $to: Int, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { currentPage lastPage hasNextPage total }
    airingSchedules(airingAt_greater: $from, airingAt_lesser: $to, sort: TIME) {
      id
      episode
      airingAt
      media { id title { native romaji english } coverImage { large } }
    }
  }
}`;

async function gql(query, variables) {
  const data = await request('POST', ENDPOINT, {
    body: { query, variables },
    timeout: 4000
  });
  if (data && data.errors && data.errors.length) {
    throw new Error('AniList: ' + data.errors[0].message);
  }
  return data && data.data;
}

async function fetchSeason(season, seasonYear, page, perPage) {
  return gql(SEASON_QUERY, { season, seasonYear, page, perPage });
}

async function fetchSchedules(from, to, page, perPage) {
  return gql(SCHEDULE_QUERY, { from, to, page, perPage });
}

module.exports = { fetchSeason, fetchSchedules };

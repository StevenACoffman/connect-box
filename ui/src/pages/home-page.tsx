import { Box, Grid2, Link, Paper, Typography } from "@mui/material";

import logo from "../images//khanmigogo.png";
import truths from "../images/2t1l.png";
import bingo from "../images/bingo.png";
import snake from "../images/snake.png";
import classy from "../images/classy.png";
import geo from "../images/geo.png";
import scavenger from "../images/scavenger.png";
import storm from "../images/storm.png";
import vocab from "../images/vocab.png";

import pollBattle from "../images/poll-battle.png";
import { black } from "../shared/colors";

const TABS = [
  {
    name: "All",
    href: "/home",
  },
  {
    name: "Games",
    href: "/games",
  },
  {
    name: "Activities",
    href: "/activities",
  },
  {
    name: "Quick",
    href: "/quick",
  },
  {
    name: "Team Based",
    href: "/team-based",
  },
];

const APPS = [
  {
    name: "Poll Battle",
    href: "/apps/poll-battle",
    thumbnail: pollBattle,
    active: true,
  },
  {
    name: "2 Truths and 1 Lie",
    href: "/apps/2t1l",
    thumbnail: truths,
    active: false,
  },
  {
    name: "Bingo",
    href: "/apps/bingo",
    thumbnail: bingo,
    active: false,
  },
  {
    name: "Snake or Snack",
    href: "/apps/snake-or-snack",
    thumbnail: snake,
    active: false,
  },
  {
    name: "Classy Chat",
    href: "/apps/classy-chat",
    thumbnail: classy,
    active: false,
  },
  {
    name: "Word Storm",
    href: "/apps/word-storm",
    thumbnail: storm,
    active: false,
  },
  {
    name: "Mission Geographical",
    href: "/apps/mission-geographical",
    thumbnail: geo,
    active: false,
  },
  {
    name: "Lightning Vocab",
    href: "/apps/lightning-vocab",
    thumbnail: vocab,
    active: false,
  },
  {
    name: "Scavenger Hunt",
    href: "/apps/scavenger-hunt",
    thumbnail: scavenger,
    active: false,
  },
];

export const HomePage = () => {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Paper
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "4px 90px",
          justifyContent: "center",
          gap: "74px",
        }}
      >
        <img src={logo} alt="KhanmigoGO" style={{ maxWidth: 340 }} />
        <div style={{ display: "flex", gap: "38px" }}>
          {TABS.map((tab) => (
            <Link
              style={{
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "20px",
                color: black,
              }}
              key={tab.name}
              href={"/home"}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </Paper>
      <Grid2
        container
        gap={"40px"}
        paddingTop={"24px"}
        justifyContent={"center"}
        // Grid should have 3 columns
        columns={3}
      >
        {APPS.map((app) => (
          <Grid2 sx={{ width: "380px" }}>
            {app.active ? (
              <Link href={app.href}>
                <img src={app.thumbnail} alt={app.name} width="100%" />
              </Link>
            ) : (
              <Box className={"hoverContainer"} width="100%">
                <img
                  src={app.thumbnail}
                  alt={app.name}
                  width="100%"
                  className="hoverImage"
                />
                <Box className={"hoverMiddle"}>
                  <Typography>Coming Soon</Typography>
                </Box>
              </Box>
            )}
          </Grid2>
        ))}
      </Grid2>
    </div>
  );
};

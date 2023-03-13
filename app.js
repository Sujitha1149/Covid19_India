const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDbandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running..");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initializeDbandServer();

//API 1
const getstateObj = (eachState) => {
  return {
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  };
};

app.get("/states/", async (request, response) => {
  const stateQuery = `
    select * from state
    `;
  const stateArray = await db.all(stateQuery);
  response.send(stateArray.map((eachState) => getstateObj(eachState)));
});

//api 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
    select * from state
    where state_id=${stateId};
    `;
  const stateArray = await db.get(stateQuery);
  response.send(getstateObj(stateArray));
});

//api 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const insertDistrict = `
    insert into district (district_name,state_id,cases,cured,active,deaths)
    values('${districtName}',${stateId},${cases},${cured},${active},${deaths});
    `;
  await db.run(insertDistrict);
  response.send("District Successfully Added");
});

//api 4
const getDistrictDetails = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const slectQuery = `
    select * from district
    where district_id=${districtId};
    `;
  const objOp = await db.get(slectQuery);
  response.send(getDistrictDetails(objOp));
});

//api 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const delQuery = `
    delete from district
    where district_id=${districtId};
    `;
  await db.run(delQuery);
  response.send("District Removed");
});
//api 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateQuery = `
    update district
    set district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
    where district_id=${districtId};
    `;
  const objj = await db.run(updateQuery);
  response.send("District Details Updated");
});

//api7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
    select sum(cases) as  totalCases,
    sum(cured) as totalCured,
    sum(active) as  totalActive,
    sum(deaths) as  totalDeaths from district
    where state_id=${stateId};
    `;
  const opArray = await db.get(stateQuery);
  response.send(opArray);
});
//api 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateQuery = `
    select state.state_name as stateName from state inner join district
    on state.state_id=district.state_id
    where district.district_id=${districtId};
    `;
  const stateArray = await db.get(stateQuery);
  response.send(stateArray);
});
module.exports = app;

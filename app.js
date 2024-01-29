const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'covid19India.db')

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const convertStateTableOfObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertDistrictTableOfObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    SELECT
    *
    FROM
    state;
    `
  const stateArray = await database.all(getStatesQuery)
  response.send(
    stateArray.map(eachState => convertStateTableOfObject(eachState)),
  )
})

app.get('/state/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
    SELECT
    *
    FROM
    state
    WHERE
    state_id=${stateId}
    `
  const state = await database.get(getStateQuery)
  response.send(convertStateTableOfObject(state))
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postDistrictQuery = `
  INSERT INTO
   district(district_name,state_id,cases,cured,active,deaths)
  VALUES
  ("${districtName}","${stateId}","${cases}","${cured}",${active},"${deaths}");
  `
  await database.run(postDistrictQuery)
  response.send('Player Added to Team')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
  SELECT
  *
  FROM
  district
  WHERE
  district_id=${districtId}
  `
  const district = await getDistrictQuery
  response.send(convertDistrictTableOfObject(district))
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
  DELETE FROM
  district
  WHERE
  district_id=${districtId};
  `
  await database.run(deleteDistrictQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtName, stateId, cases, curved, active, deaths} = request.body
  const {districtId} = request.params
  const updateDistrictQuery = `
  UPDATE
  district
  SET
  district_name="${districtName}",
  state_id="${stateId}",
  cases="${cases}",
  curved="${curved}",
  active="${active}",
  deaths="${deaths}"
  WHERE
  district_id="${districtId}"
  `
  await database.run(updateDistrictQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', (request, response) => {
  const {stateId} = request.params
  const getStatesStats = `
  SELECT
  SUM(cases),
  SUM(cured),
  SUM(active),
  SUM(deaths)
  FROM
  district
  WHERE
  state_id="${stateId}"
  `
  const stats = await database.run(getStatesStats)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
    select state_id from district
    where district_id = ${districtId};
    ` //With this we will get the state_id using district table
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery)
  const getStateNameQuery = `
    select state_name as stateName from state
    where state_id = ${getDistrictIdQueryResponse.state_id};
    `
  const getStateNameQueryResponse = await database.get(getStateNameQuery)
  response.send(getStateNameQueryResponse)
})

module.exports = app

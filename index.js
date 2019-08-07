const { createEventAdapter } = require('@slack/events-api')
const { WebClient } = require('@slack/web-api')
const assert = require('assert')
const axios = require('axios')
const uuid = require('uuid/v4')

const port = process.env.PORT || 3000
const token = process.env.SLACK_TOKEN
const PTTAI_GATEWAY_URL = process.env.PTTAI_GATEWAY_URL
const PTTAI_TOKEN = process.env.PTTAI_TOKEN

assert.ok(port)
assert.ok(token)
assert.ok(PTTAI_GATEWAY_URL)
assert.ok(PTTAI_TOKEN)

async function main () {
  const web = new WebClient(token)

  let channels = await loadChannels(web)
  console.log(channels)
  let users = await loadUsers(web)

  const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET)
  slackEvents.on('message', async (event) => {
    console.log(event)
    console.log(`Received a message event: user ${users[event.user]} in channel ${channels[event.channel]} says ${event.text}`)

    await post(channels[event.channel], `<${users[event.user]}>: ${event.text}`)
  })

  slackEvents.on('error', console.error)

  slackEvents.start(port).then(() => {
    console.log(`server listening on port ${port}`)
  })
}

async function loadUsers (web) {
  let t = {}
  let res = await web.users.list()
  res.members.forEach(x => t[x.id] = x.name)

  return t
}

async function loadChannels (web) {
  let t = {}
  let res = await web.channels.list()
  res.channels.forEach(x => t[x.id] = x.name)

  return t
}

async function post (topic, text) {
  return axios.request({ url: `${PTTAI_GATEWAY_URL}/topics/${topic}`, data: { data: { id: uuid(), message: { type: 'text', value: text } } }, method: 'POST', params: { token: PTTAI_TOKEN } })
}

main()

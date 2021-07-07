# SinchVideo

Simple 1-to-1 video conferencing web app using Sinch and real-time chat using firebase.

## Choice of tool

I chose this after going over and reviewing certain different tools like Agora, AWS Chime, Azure Communication Services and other 3rd party srvices, reason was ease of use, no-cost service provision and good documentation. I chose firebase because it provides realtime database functionality for free and can be used with static javascript file as well.

## Design and Architecture

Currently a very simple design including basic HTML, CSS(bootsrap) at the index page and using Sinch APIs from client side JS file to connect two people after successful login from each side. Chat functionality is implemented by using firebase realtime database where each message from a user is sent and stored to the db. For guest user the latest/last message from db(which is from the other user) is fetched and is shown on the HTML page. 
 
## Live Prototype

https://jewel-pinto-gasoline.glitch.me/ (work in progress!)

## Deployment

I used glitch as it is an online ide which provides free 1000 hours/month of services and static sites are always available to be hosted for free on their platform.

## Features

1-1 video calling functinality and realtime chat functionality supported. Sinch provides basic API endpoints for video calling and firebase provides realtime database with few query operations.

const redis = require("redis");
const { REDIS_CONFIG } = require("../constant/events");

const redisClient = redis.createClient(REDIS_CONFIG);

redisClient.on("error", (error) => {
  console.log('Redis Client Error: ', error);
});

module.exports = redisClient;
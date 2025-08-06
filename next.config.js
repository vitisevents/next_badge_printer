/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    TT_APIKEY: process.env.TT_APIKEY,
  },
}

module.exports = nextConfig
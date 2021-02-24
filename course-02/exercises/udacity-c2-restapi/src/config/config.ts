export const config = {
  "dev": {
    "username": process.env.POSTGRESS_USERNAME,
    "password": process.env.POSTGRES_PASSWORD,
    "database": process.env.POSTGRESS_DATABSE,
    "host": process.env.POSTGRESS_host,
    "dialect": "postgres",
    "aws_region": process.env.POSTGRESS_REGION,
    "aws_profile": process.env.POSTGRESS_AWS_PROFILE,
    "aws_media_bucket": process.env.POSTGRESS_AWS_MEDIA_BUCKET
  },
  "prod": {
    "username": "",
    "password": "",
    "database": "udagram_prod",
    "host": "",
    "dialect": "postgres"
  },
  "jwt": {
    "secret":process.env.POSTGRESS_SECRET
  }
}

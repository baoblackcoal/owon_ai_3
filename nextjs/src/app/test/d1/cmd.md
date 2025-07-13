npx wrangler d1 execute test_d1 --local --file=./src/app/test/d1/schema.sql
npx wrangler d1 execute test_d1 --local --command="SELECT * FROM Customers"


npx wrangler d1 execute test_d1 --remote --file=./src/app/test/d1/schema.sql
npx wrangler d1 execute test_d1 --remote --command="SELECT * FROM Customers"

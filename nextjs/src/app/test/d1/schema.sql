DROP TABLE IF EXISTS Customers;
CREATE TABLE IF NOT EXISTS Customers (CustomerId INTEGER PRIMARY KEY, CompanyName TEXT, ContactName TEXT, Age INTEGER);
INSERT INTO Customers (CustomerID, CompanyName, ContactName, Age) VALUES 
(1, 'Alfreds Futterkiste', 'Maria Anders', 32), 
(4, 'Around the Horn', 'Thomas Hardy', 45), 
(11, 'Bs Beverages', 'Victoria Ashworth', 48), 
(13, 'Bs Beverages', 'Random Name', 35);
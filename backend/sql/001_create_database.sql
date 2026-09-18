-- =============================================
-- Création de la base de données (SQL Server / SSMS)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'meeting_room_booking')
BEGIN
    CREATE DATABASE meeting_room_booking;
END
GO

USE meeting_room_booking;
GO

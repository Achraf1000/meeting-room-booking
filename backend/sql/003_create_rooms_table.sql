-- =============================================
-- Table : rooms (SQL Server / SSMS)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[rooms]') AND type in (N'U'))
BEGIN
    CREATE TABLE rooms (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        name            NVARCHAR(100)   NOT NULL UNIQUE,
        capacity        INT             NOT NULL DEFAULT 10,
        floor           NVARCHAR(50)    NULL,
        description     NVARCHAR(MAX)   NULL,
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2       NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX idx_rooms_active ON rooms(is_active);
END
GO

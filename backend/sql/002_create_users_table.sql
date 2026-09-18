-- =============================================
-- Table : users (SQL Server / SSMS)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE users (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        full_name       NVARCHAR(150)   NOT NULL,
        email           NVARCHAR(255)   NOT NULL UNIQUE,
        password_hash   NVARCHAR(500)   NOT NULL,
        role            NVARCHAR(20)    NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        department      NVARCHAR(100)   NULL,
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_at      DATETIME2       NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_role ON users(role);
END
GO

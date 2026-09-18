-- =========================================================
-- SCRIPT COMPLET MICROSOFT SQL SERVER (SSMS) - VERSION PORTFOLIO
-- Copiez-collez ou ouvrez ce fichier directement dans SSMS et appuyez sur F5 (Exécuter)
-- =========================================================

-- 1. Création de la Base de données
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'meeting_room_booking')
BEGIN
    CREATE DATABASE meeting_room_booking;
END
GO

USE meeting_room_booking;
GO

-- 2. Table : users
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

-- 3. Table : rooms
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

-- 4. Table : room_equipment
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[room_equipment]') AND type in (N'U'))
BEGIN
    CREATE TABLE room_equipment (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        room_id         INT             NOT NULL,
        equipment_name  NVARCHAR(100)   NOT NULL,

        CONSTRAINT fk_equipment_room
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );

    CREATE INDEX idx_equipment_room ON room_equipment(room_id);
END
GO

-- 5. Table : reservations
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[reservations]') AND type in (N'U'))
BEGIN
    CREATE TABLE reservations (
        id                  INT IDENTITY(1,1) PRIMARY KEY,
        user_id             INT             NOT NULL,
        room_id             INT             NOT NULL,
        title               NVARCHAR(200)   NOT NULL,
        description         NVARCHAR(MAX)   NULL,
        reservation_date    DATE            NOT NULL,
        start_time          TIME            NOT NULL,
        end_time            TIME            NOT NULL,
        status              NVARCHAR(20)    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        admin_comment       NVARCHAR(MAX)   NULL,
        approved_by         INT             NULL,
        created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_at          DATETIME2       NOT NULL DEFAULT GETDATE(),

        CONSTRAINT fk_reservation_user
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_reservation_room
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        CONSTRAINT fk_reservation_approver
            FOREIGN KEY (approved_by) REFERENCES users(id)
    );

    CREATE INDEX idx_reservation_date ON reservations(reservation_date);
    CREATE INDEX idx_reservation_status ON reservations(status);
    CREATE INDEX idx_reservation_user ON reservations(user_id);
    CREATE INDEX idx_reservation_room ON reservations(room_id);
END
GO

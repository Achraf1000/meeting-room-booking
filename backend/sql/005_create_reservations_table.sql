-- =============================================
-- Table : reservations (SQL Server / SSMS)
-- =============================================
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

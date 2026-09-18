-- =============================================
-- Table : room_equipment (SQL Server / SSMS)
-- =============================================
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

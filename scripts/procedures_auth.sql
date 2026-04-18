SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

USE vacation_control;
GO

CREATE OR ALTER PROCEDURE dbo.spError_GetByCode
    @inCodigo INT,
    @outDescripcion NVARCHAR(1000) OUTPUT,
    @outResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @outResultCode = 50008;
    SET @outDescripcion = N'';

    BEGIN TRY
        SELECT
            @outDescripcion = e.Descripcion
        FROM
            dbo.Error AS e
        WHERE
            e.Codigo = @inCodigo;

        IF (@outDescripcion IS NULL OR LTRIM(RTRIM(@outDescripcion)) = N'')
        BEGIN
            SET @outDescripcion = N'Error desconocido';
            SET @outResultCode = 50008;
        END;
        ELSE
        BEGIN
            SET @outResultCode = 0;
        END;
    END TRY
    BEGIN CATCH
        INSERT INTO dbo.DBError
        (
            UserName,
            Number,
            State,
            Severity,
            Line,
            [Procedure],
            [Message],
            [DateTime]
        )
        VALUES
        (
            SUSER_SNAME(),
            ERROR_NUMBER(),
            ERROR_STATE(),
            ERROR_SEVERITY(),
            ERROR_LINE(),
            ERROR_PROCEDURE(),
            ERROR_MESSAGE(),
            SYSDATETIME()
        );

        SET @outResultCode = 50008;
        SET @outDescripcion = N'Error de base de datos';
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE dbo.spAuth_CheckLoginAvailability
    @inUsername NVARCHAR(200),
    @inClientIP NVARCHAR(45),
    @outResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @outResultCode = 50008;

    DECLARE @UserNorm NVARCHAR(200);
    DECLARE @Ahora DATETIME2(0) = SYSUTCDATETIME();
    DECLARE @Limite10Min DATETIME2(0) = DATEADD(MINUTE, -10, @Ahora);

    BEGIN TRY
        IF (
            @inUsername IS NULL
            OR LTRIM(RTRIM(@inUsername)) = N''
            OR @inClientIP IS NULL
            OR LTRIM(RTRIM(@inClientIP)) = N''
        )
        BEGIN
            SET @outResultCode = 50008;

            RETURN;
        END;

        SET @UserNorm = LTRIM(RTRIM(@inUsername));

        IF EXISTS
        (
            SELECT
                1
            FROM
                dbo.BitacoraEvento AS b
            WHERE
                b.IdTipoEvento = 3
                AND b.IntentoUsername = @UserNorm
                AND b.PostInIP = @inClientIP
                AND b.PostTime >= @Limite10Min
        )
        BEGIN
            SET @outResultCode = 50003;

            RETURN;
        END;

        SET @outResultCode = 0;
    END TRY
    BEGIN CATCH
        INSERT INTO dbo.DBError
        (
            UserName,
            Number,
            State,
            Severity,
            Line,
            [Procedure],
            [Message],
            [DateTime]
        )
        VALUES
        (
            SUSER_SNAME(),
            ERROR_NUMBER(),
            ERROR_STATE(),
            ERROR_SEVERITY(),
            ERROR_LINE(),
            ERROR_PROCEDURE(),
            ERROR_MESSAGE(),
            SYSDATETIME()
        );

        SET @outResultCode = 50008;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE dbo.spAuth_Login
    @inUsername NVARCHAR(200),
    @inPassword NVARCHAR(500),
    @inClientIP NVARCHAR(45),
    @outUserId INT OUTPUT,
    @outUsername NVARCHAR(200) OUTPUT,
    @outResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @outResultCode = 50008;
    SET @outUserId = NULL;
    SET @outUsername = NULL;

    DECLARE @UserNorm NVARCHAR(200);
    DECLARE @UserId INT;
    DECLARE @PwdAlmacenado NVARCHAR(500);
    DECLARE @Ahora DATETIME2(0) = SYSUTCDATETIME();
    DECLARE @Limite10Min DATETIME2(0) = DATEADD(MINUTE, -10, @Ahora);
    DECLARE @Limite20Min DATETIME2(0) = DATEADD(MINUTE, -20, @Ahora);
    DECLARE @CuentaFallos20Min INT;
    DECLARE @NuevoNumeroIntento INT;
    DECLARE @DescFallo NVARCHAR(MAX);
    DECLARE @CodigoFallo INT;

    BEGIN TRY
        IF (
            @inUsername IS NULL
            OR LTRIM(RTRIM(@inUsername)) = N''
            OR @inPassword IS NULL
            OR @inPassword = N''
            OR @inClientIP IS NULL
            OR LTRIM(RTRIM(@inClientIP)) = N''
        )
        BEGIN
            SET @outResultCode = 50008;

            RETURN;
        END;

        SET @UserNorm = LTRIM(RTRIM(@inUsername));

        IF EXISTS
        (
            SELECT
                1
            FROM
                dbo.BitacoraEvento AS b
            WHERE
                b.IdTipoEvento = 3
                AND b.IntentoUsername = @UserNorm
                AND b.PostInIP = @inClientIP
                AND b.PostTime >= @Limite10Min
        )
        BEGIN
            SET @outResultCode = 50003;

            RETURN;
        END;

        SELECT
            @UserId = u.Id,
            @PwdAlmacenado = u.Password
        FROM
            dbo.Usuario AS u
        WHERE
            u.Username = @UserNorm;

        IF (@UserId IS NULL)
        BEGIN
            SELECT
                @CuentaFallos20Min = COUNT(1)
            FROM
                dbo.BitacoraEvento AS b
            WHERE
                b.IdTipoEvento = 2
                AND b.IntentoUsername = @UserNorm
                AND b.PostInIP = @inClientIP
                AND b.PostTime >= @Limite20Min;

            SET @NuevoNumeroIntento = @CuentaFallos20Min + 1;
            SET @CodigoFallo = 50001;
            SET @DescFallo =
                CAST(@NuevoNumeroIntento AS NVARCHAR(20))
                + N', '
                + CAST(@CodigoFallo AS NVARCHAR(20));

            BEGIN TRANSACTION;

            INSERT INTO dbo.BitacoraEvento
            (
                IdTipoEvento,
                Descripcion,
                IdPostByUser,
                PostInIP,
                IntentoUsername,
                PostTime
            )
            VALUES
            (
                2,
                @DescFallo,
                NULL,
                @inClientIP,
                @UserNorm,
                @Ahora
            );

            IF (@NuevoNumeroIntento > 5)
            BEGIN
                INSERT INTO dbo.BitacoraEvento
                (
                    IdTipoEvento,
                    Descripcion,
                    IdPostByUser,
                    PostInIP,
                    IntentoUsername,
                    PostTime
                )
                VALUES
                (
                    3,
                    NULL,
                    NULL,
                    @inClientIP,
                    @UserNorm,
                    @Ahora
                );
            END;

            COMMIT TRANSACTION;

            SET @outResultCode = 50001;

            RETURN;
        END;

        IF (@PwdAlmacenado = @inPassword)
        BEGIN
            INSERT INTO dbo.BitacoraEvento
            (
                IdTipoEvento,
                Descripcion,
                IdPostByUser,
                PostInIP,
                IntentoUsername,
                PostTime
            )
            VALUES
            (
                1,
                N'Exitoso',
                @UserId,
                @inClientIP,
                @UserNorm,
                @Ahora
            );

            SET @outUserId = @UserId;
            SET @outUsername = @UserNorm;
            SET @outResultCode = 0;

            RETURN;
        END;

        SELECT
            @CuentaFallos20Min = COUNT(1)
        FROM
            dbo.BitacoraEvento AS b
        WHERE
            b.IdTipoEvento = 2
            AND b.IntentoUsername = @UserNorm
            AND b.PostInIP = @inClientIP
            AND b.PostTime >= @Limite20Min;

        SET @NuevoNumeroIntento = @CuentaFallos20Min + 1;
        SET @CodigoFallo = 50002;
        SET @DescFallo =
            CAST(@NuevoNumeroIntento AS NVARCHAR(20))
            + N', '
            + CAST(@CodigoFallo AS NVARCHAR(20));

        BEGIN TRANSACTION;

        INSERT INTO dbo.BitacoraEvento
        (
            IdTipoEvento,
            Descripcion,
            IdPostByUser,
            PostInIP,
            IntentoUsername,
            PostTime
        )
        VALUES
        (
            2,
            @DescFallo,
            @UserId,
            @inClientIP,
            @UserNorm,
            @Ahora
        );

        IF (@NuevoNumeroIntento > 5)
        BEGIN
            INSERT INTO dbo.BitacoraEvento
            (
                IdTipoEvento,
                Descripcion,
                IdPostByUser,
                PostInIP,
                IntentoUsername,
                PostTime
            )
            VALUES
            (
                3,
                NULL,
                @UserId,
                @inClientIP,
                @UserNorm,
                @Ahora
            );
        END;

        COMMIT TRANSACTION;

        SET @outResultCode = 50002;
    END TRY
    BEGIN CATCH
        IF (@@TRANCOUNT > 0)
        BEGIN
            ROLLBACK TRANSACTION;
        END;

        INSERT INTO dbo.DBError
        (
            UserName,
            Number,
            State,
            Severity,
            Line,
            [Procedure],
            [Message],
            [DateTime]
        )
        VALUES
        (
            SUSER_SNAME(),
            ERROR_NUMBER(),
            ERROR_STATE(),
            ERROR_SEVERITY(),
            ERROR_LINE(),
            ERROR_PROCEDURE(),
            ERROR_MESSAGE(),
            SYSDATETIME()
        );

        SET @outResultCode = 50008;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE dbo.spAuth_Logout
    @inUserId INT,
    @inClientIP NVARCHAR(45),
    @outResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @outResultCode = 50008;

    DECLARE @Ahora DATETIME2(0) = SYSUTCDATETIME();

    BEGIN TRY
        IF (
            @inUserId IS NULL
            OR @inUserId <= 0
            OR @inClientIP IS NULL
            OR LTRIM(RTRIM(@inClientIP)) = N''
        )
        BEGIN
            SET @outResultCode = 50008;

            RETURN;
        END;

        IF NOT EXISTS
        (
            SELECT
                1
            FROM
                dbo.Usuario AS u
            WHERE
                u.Id = @inUserId
        )
        BEGIN
            SET @outResultCode = 50001;

            RETURN;
        END;

        INSERT INTO dbo.BitacoraEvento
        (
            IdTipoEvento,
            Descripcion,
            IdPostByUser,
            PostInIP,
            IntentoUsername,
            PostTime
        )
        VALUES
        (
            4,
            NULL,
            @inUserId,
            @inClientIP,
            NULL,
            @Ahora
        );

        SET @outResultCode = 0;
    END TRY
    BEGIN CATCH
        INSERT INTO dbo.DBError
        (
            UserName,
            Number,
            State,
            Severity,
            Line,
            [Procedure],
            [Message],
            [DateTime]
        )
        VALUES
        (
            SUSER_SNAME(),
            ERROR_NUMBER(),
            ERROR_STATE(),
            ERROR_SEVERITY(),
            ERROR_LINE(),
            ERROR_PROCEDURE(),
            ERROR_MESSAGE(),
            SYSDATETIME()
        );

        SET @outResultCode = 50008;
    END CATCH;
END;
GO

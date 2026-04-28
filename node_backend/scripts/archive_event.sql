-- Event Scheduler requires ON
SET GLOBAL event_scheduler = ON;

USE hms_main;

DELIMITER $$

CREATE EVENT IF NOT EXISTS daily_archive_event
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY) -- Starts exactly at midnight tonight
DO
BEGIN
    DECLARE exit handler for sqlexception
    BEGIN
        -- Error handling: Rollback the transaction on failure
        ROLLBACK;
    END;

    START TRANSACTION;

    -- 1. Archive Appointments
    INSERT INTO hms_archive.appointments (id, patient_id, doctor_id, start_time, duration, created_at)
    SELECT id, patient_id, doctor_id, start_time, duration, created_at
    FROM hms_main.appointments
    WHERE DATE(created_at) < CURRENT_DATE;

    DELETE FROM hms_main.appointments
    WHERE DATE(created_at) < CURRENT_DATE;

    -- 2. Archive Login Logs
    INSERT INTO hms_archive.login_logs (id, user_id, login_time, logout_time, role)
    SELECT id, user_id, login_time, logout_time, role
    FROM hms_main.login_logs
    WHERE DATE(login_time) < CURRENT_DATE;

    DELETE FROM hms_main.login_logs
    WHERE DATE(login_time) < CURRENT_DATE;

    -- (Optional) If you want to replicate user accounts to archive to resolve foreign key lookups manually
    INSERT IGNORE INTO hms_archive.users (id, name, email, password, role, created_at)
    SELECT id, name, email, password, role, created_at
    FROM hms_main.users;

    COMMIT;
END$$

DELIMITER ;

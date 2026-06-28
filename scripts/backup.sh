#!/bin/bash
# Backup and Disaster Recovery Script for Elite Fitness
# Usage: ./backup.sh [daily|weekly|monthly|restore]

set -e

BACKUP_DIR="${BACKUP_DIR:=/backups}"
DB_HOST="${DB_HOST:=postgres}"
DB_USER="${DB_USER:=elite}"
DB_NAME="${DB_NAME:=elite_fitness}"
RETENTION_DAYS=30
AWS_S3_BUCKET="${AWS_S3_BUCKET}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

create_backup() {
    local backup_type=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/elite-fitness-${backup_type}-${timestamp}.sql.gz"

    log_info "Starting ${backup_type} backup..."
    mkdir -p "${BACKUP_DIR}"

    # Backup database
    if PGPASSWORD="${DB_PASSWORD}" pg_dump -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${backup_file}"; then
        log_info "Backup completed: ${backup_file}"
        local file_size=$(du -h "${backup_file}" | cut -f1)
        log_info "Backup size: ${file_size}"

        # Upload to S3 if configured
        if [ -n "${AWS_S3_BUCKET}" ]; then
            log_info "Uploading backup to S3..."
            aws s3 cp "${backup_file}" "s3://${AWS_S3_BUCKET}/backups/" --region us-east-1
            log_info "Backup uploaded to S3"
        fi

        # Cleanup old backups
        cleanup_old_backups
    else
        log_error "Backup failed!"
        return 1
    fi
}

cleanup_old_backups() {
    log_info "Cleaning up backups older than ${RETENTION_DAYS} days..."
    find "${BACKUP_DIR}" -name "elite-fitness-*.sql.gz" -mtime +${RETENTION_DAYS} -delete
    log_info "Cleanup completed"
}

restore_backup() {
    local backup_file=$1

    if [ ! -f "${backup_file}" ]; then
        log_error "Backup file not found: ${backup_file}"
        return 1
    fi

    log_warn "WARNING: This will overwrite the existing database!"
    read -p "Are you sure? (yes/no): " confirm
    if [ "${confirm}" != "yes" ]; then
        log_info "Restore cancelled"
        return 0
    fi

    log_info "Restoring from backup: ${backup_file}"

    # Extract and restore
    if gunzip -c "${backup_file}" | PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}"; then
        log_info "Restore completed successfully"
    else
        log_error "Restore failed!"
        return 1
    fi
}

verify_backup() {
    local backup_file=$1

    log_info "Verifying backup integrity..."
    if gzip -t "${backup_file}"; then
        log_info "Backup is valid"
        return 0
    else
        log_error "Backup is corrupted!"
        return 1
    fi
}

list_backups() {
    log_info "Available backups:"
    ls -lh "${BACKUP_DIR}"/elite-fitness-*.sql.gz 2>/dev/null || log_warn "No backups found"
}

test_recovery() {
    log_info "Testing disaster recovery procedures..."
    local latest_backup=$(ls -t "${BACKUP_DIR}"/elite-fitness-*.sql.gz 2>/dev/null | head -1)

    if [ -z "${latest_backup}" ]; then
        log_error "No backups found for testing"
        return 1
    fi

    log_info "Testing recovery with: ${latest_backup}"
    verify_backup "${latest_backup}"
}

# Main script logic
case "${1:-daily}" in
    daily)
        create_backup "daily"
        ;;
    weekly)
        create_backup "weekly"
        ;;
    monthly)
        create_backup "monthly"
        ;;
    restore)
        restore_backup "${2:-.}"
        ;;
    list)
        list_backups
        ;;
    verify)
        verify_backup "${2:-.}"
        ;;
    test)
        test_recovery
        ;;
    *)
        echo "Usage: $0 {daily|weekly|monthly|restore|list|verify|test} [backup_file]"
        exit 1
        ;;
esac

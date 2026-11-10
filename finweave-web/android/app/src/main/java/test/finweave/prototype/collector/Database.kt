package test.finweave.prototype.collector

import androidx.room.*
@Entity(tableName = "installation_meta")
data class InstallationRow(@PrimaryKey val id: Int = 1, val generation: Int, val consent: String?, val reason: String?, val revokePending: Boolean, val activeVault: String?)
@Entity(tableName = "owner_vaults", primaryKeys = ["vault", "version"])
data class VaultKey(val vault: String, val version: Int, val wrapped: ByteArray, val wrapIv: ByteArray, val alias: String, val prefix: ByteArray, val counter: Long)

@Entity(tableName = "outbox_items", foreignKeys = [ForeignKey(entity = VaultKey::class, parentColumns = ["vault","version"], childColumns = ["vault","keyVersion"], onDelete = ForeignKey.RESTRICT)], indices = [Index(value = ["vault","keyVersion"]), Index(value = ["vault","state","sequence"])])
data class OutboxRow(@PrimaryKey val id: String, val vault: String, val state: String, val sequence: Long, val keyVersion: Int, val iv: ByteArray, val cipher: ByteArray, val expires: Long, val bytes: Int)

@Entity(tableName = "capture_identities", foreignKeys = [ForeignKey(entity = VaultKey::class, parentColumns = ["vault","version"], childColumns = ["vault","keyVersion"], onDelete = ForeignKey.RESTRICT)], indices = [Index(value = ["vault","keyVersion"]), Index(value = ["vault","state","sequence"])])
data class CaptureRow(@PrimaryKey val id: String, val vault: String, val state: String, val sequence: Long, val keyVersion: Int, val iv: ByteArray, val cipher: ByteArray, val expires: Long, val bytes: Int)

@Entity(tableName = "upload_batches", foreignKeys = [ForeignKey(entity = VaultKey::class, parentColumns = ["vault","version"], childColumns = ["vault","keyVersion"], onDelete = ForeignKey.RESTRICT)], indices = [Index(value = ["vault","keyVersion"]), Index(value = ["vault","state","sequence"])])
data class BatchRow(@PrimaryKey val id: String, val vault: String, val state: String, val sequence: Long, val keyVersion: Int, val iv: ByteArray, val cipher: ByteArray, val expires: Long, val bytes: Int)

@Entity(tableName = "ack_replay", foreignKeys = [ForeignKey(entity = VaultKey::class, parentColumns = ["vault","version"], childColumns = ["vault","keyVersion"], onDelete = ForeignKey.RESTRICT)], indices = [Index(value = ["vault","keyVersion"]), Index(value = ["vault","state","sequence"])])
data class AckRow(@PrimaryKey val id: String, val vault: String, val state: String, val sequence: Long, val keyVersion: Int, val iv: ByteArray, val cipher: ByteArray, val expires: Long, val bytes: Int)

@Entity(tableName = "coverage_gaps", foreignKeys = [ForeignKey(entity = VaultKey::class, parentColumns = ["vault","version"], childColumns = ["vault","keyVersion"], onDelete = ForeignKey.RESTRICT)], indices = [Index(value = ["vault","keyVersion"]), Index(value = ["vault","state","sequence"])])
data class GapRow(@PrimaryKey val id: String, val vault: String, val state: String, val sequence: Long, val keyVersion: Int, val iv: ByteArray, val cipher: ByteArray, val expires: Long, val bytes: Int)

@Entity(tableName = "auth_pending", foreignKeys = [ForeignKey(entity = VaultKey::class, parentColumns = ["vault","version"], childColumns = ["vault","keyVersion"], onDelete = ForeignKey.RESTRICT)], indices = [Index(value = ["vault","keyVersion"]), Index(value = ["vault","state","sequence"])])
data class AuthRow(@PrimaryKey val id: String, val vault: String, val state: String, val sequence: Long, val keyVersion: Int, val iv: ByteArray, val cipher: ByteArray, val expires: Long, val bytes: Int)

@Dao abstract class CollectorDao {
    @Query("SELECT * FROM installation_meta WHERE id=1") abstract fun installation(): InstallationRow?
    @Insert(onConflict=OnConflictStrategy.REPLACE) abstract fun installation(row: InstallationRow)
    @Insert abstract fun key(row: VaultKey)
    @Query("SELECT * FROM owner_vaults WHERE vault=:vault ORDER BY version") abstract fun keys(vault: String): List<VaultKey>
    @Query("UPDATE owner_vaults SET counter=counter+1 WHERE vault=:vault AND version=:version AND counter<9223372036854775806") abstract fun reserve(vault:String, version:Int):Int
    @Query("SELECT * FROM owner_vaults WHERE vault=:vault AND version=:version") abstract fun key(vault:String, version:Int):VaultKey

    @Insert(onConflict=OnConflictStrategy.REPLACE) abstract fun put(row:OutboxRow)
    @Query("SELECT * FROM outbox_items WHERE vault=:vault ORDER BY sequence") abstract fun outbox_items(vault:String):List<OutboxRow>
    @Query("DELETE FROM outbox_items WHERE id=:id AND vault=:vault") abstract fun deleteOutboxRow(id:String,vault:String)

    @Insert(onConflict=OnConflictStrategy.REPLACE) abstract fun put(row:CaptureRow)
    @Query("SELECT * FROM capture_identities WHERE vault=:vault ORDER BY sequence") abstract fun capture_identities(vault:String):List<CaptureRow>
    @Query("DELETE FROM capture_identities WHERE id=:id AND vault=:vault") abstract fun deleteCaptureRow(id:String,vault:String)

    @Insert(onConflict=OnConflictStrategy.REPLACE) abstract fun put(row:BatchRow)
    @Query("SELECT * FROM upload_batches WHERE vault=:vault ORDER BY sequence") abstract fun upload_batches(vault:String):List<BatchRow>
    @Query("DELETE FROM upload_batches WHERE id=:id AND vault=:vault") abstract fun deleteBatchRow(id:String,vault:String)

    @Insert(onConflict=OnConflictStrategy.REPLACE) abstract fun put(row:AckRow)
    @Query("SELECT * FROM ack_replay WHERE vault=:vault ORDER BY sequence") abstract fun ack_replay(vault:String):List<AckRow>
    @Query("DELETE FROM ack_replay WHERE id=:id AND vault=:vault") abstract fun deleteAckRow(id:String,vault:String)

    @Insert(onConflict=OnConflictStrategy.REPLACE) abstract fun put(row:GapRow)
    @Query("SELECT * FROM coverage_gaps WHERE vault=:vault ORDER BY sequence") abstract fun coverage_gaps(vault:String):List<GapRow>
    @Query("DELETE FROM coverage_gaps WHERE id=:id AND vault=:vault") abstract fun deleteGapRow(id:String,vault:String)

    @Insert(onConflict=OnConflictStrategy.REPLACE) abstract fun put(row:AuthRow)
    @Query("SELECT * FROM auth_pending WHERE vault=:vault ORDER BY sequence") abstract fun auth_pending(vault:String):List<AuthRow>
    @Query("DELETE FROM auth_pending WHERE id=:id AND vault=:vault") abstract fun deleteAuthRow(id:String,vault:String)

    @Query("UPDATE outbox_items SET state='quarantined' WHERE vault=:vault") abstract fun quarantine(vault:String)
    @Query("DELETE FROM outbox_items WHERE vault=:vault AND state='quarantined'") abstract fun deleteQuarantined(vault:String):Int
}
@Database(entities=[InstallationRow::class,VaultKey::class,OutboxRow::class,CaptureRow::class,BatchRow::class,AckRow::class,GapRow::class,AuthRow::class], version=1, exportSchema=true)
abstract class CollectorDatabase: RoomDatabase() { abstract fun dao():CollectorDao }


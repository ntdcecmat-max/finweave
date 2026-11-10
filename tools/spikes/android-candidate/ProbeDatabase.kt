package synthetic.finweave.spike

import android.content.Context
import androidx.room.*

// Ciphertext storage probe ONLY. No native encryption/nonce/owner authority claim.
@Entity(tableName = "probe_ciphertexts")
data class ProbeRow(@PrimaryKey val id: String, val epoch: Long, val ciphertext: ByteArray)
@Dao interface ProbeDao {
    @Insert(onConflict = OnConflictStrategy.ABORT) suspend fun insert(row: ProbeRow)
    @Query("SELECT * FROM probe_ciphertexts WHERE id = :id") suspend fun get(id: String): ProbeRow?
}
@Database(entities = [ProbeRow::class], version = 1, exportSchema = true)
abstract class ProbeDatabase : RoomDatabase() {
    abstract fun probeDao(): ProbeDao
    companion object {
        fun open(context: Context): ProbeDatabase = Room.databaseBuilder(context,ProbeDatabase::class.java,
            java.io.File(context.noBackupFilesDir,"synthetic-probe.db").absolutePath).build()
        // No fallbackToDestructiveMigration.
    }
}

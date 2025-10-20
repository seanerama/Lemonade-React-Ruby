class RemoveEmailUniqueConstraintFromPlayers < ActiveRecord::Migration[8.0]
  def change
    # Remove the unique index on email
    remove_index :players, :email if index_exists?(:players, :email)

    # Make email nullable since it's optional
    change_column_null :players, :email, true

    # Add a unique index that allows NULL emails (PostgreSQL allows multiple NULLs)
    # But we still want unique non-null emails
    add_index :players, :email, unique: true, where: "email IS NOT NULL AND email != ''"
  end
end

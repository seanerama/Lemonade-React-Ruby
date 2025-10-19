class AddUsernameToPlayers < ActiveRecord::Migration[8.0]
  def change
    # Add username column
    add_column :players, :username, :string
    add_index :players, :username, unique: true

    # Make email nullable (optional)
    change_column_null :players, :email, true

    # Change games foreign key from player_email to player_username
    add_column :games, :player_username, :string
    add_index :games, :player_username
    add_index :games, [:player_username, :slot_number], unique: true

    # Note: player_email column will be removed in a future migration
    # after data has been migrated
  end
end

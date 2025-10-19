class RemovePlayerEmailFromGames < ActiveRecord::Migration[8.0]
  def change
    # Remove the old player_email column and indexes
    remove_index :games, name: "index_games_on_player_email_and_slot_number", if_exists: true
    remove_index :games, name: "index_games_on_player_email", if_exists: true
    remove_column :games, :player_email, :string
  end
end

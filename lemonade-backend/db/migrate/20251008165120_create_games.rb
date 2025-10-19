class CreateGames < ActiveRecord::Migration[7.0]
  def change
    create_table :games do |t|
      t.string :game_id, null: false
      t.string :player_email, null: false
      t.integer :slot_number, null: false
      t.jsonb :game_data, null: false, default: {}

      t.timestamps
    end
    
    add_index :games, :game_id, unique: true
    add_index :games, :player_email
    add_index :games, [:player_email, :slot_number], unique: true
  end
end
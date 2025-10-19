class CreatePlayers < ActiveRecord::Migration[7.0]
  def change
    create_table :players do |t|
      t.string :email, null: false
      t.string :name, null: false
      t.string :password_digest, null: false
      t.string :game_slot_1
      t.string :game_slot_2
      t.string :game_slot_3

      t.timestamps
    end
    
    add_index :players, :email, unique: true
  end
end
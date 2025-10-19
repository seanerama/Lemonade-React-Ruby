# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_10_16_183146) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "games", force: :cascade do |t|
    t.string "game_id", null: false
    t.integer "slot_number", null: false
    t.jsonb "game_data", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "player_username"
    t.index ["game_id"], name: "index_games_on_game_id", unique: true
    t.index ["player_username", "slot_number"], name: "index_games_on_player_username_and_slot_number", unique: true
    t.index ["player_username"], name: "index_games_on_player_username"
  end

  create_table "players", force: :cascade do |t|
    t.string "email"
    t.string "name", null: false
    t.string "password_digest", null: false
    t.string "game_slot_1"
    t.string "game_slot_2"
    t.string "game_slot_3"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "username"
    t.index ["email"], name: "index_players_on_email", unique: true
    t.index ["username"], name: "index_players_on_username", unique: true
  end
end

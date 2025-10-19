class Api::PlayersController < ApplicationController
  # POST /api/players
  def create
    player = Player.new(player_params)

    if player.save
      render json: {
        message: "Player created successfully",
        player: {
          username: player.username,
          email: player.email,
          name: player.name,
          game_slots: [
            player.game_slot_1,
            player.game_slot_2,
            player.game_slot_3
          ]
        }
      }, status: :created
    else
      render json: { errors: player.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # GET /api/players/:username
  def show
    player = Player.find_by(username: params[:username])

    if player
      render json: {
        username: player.username,
        email: player.email,
        name: player.name,
        game_slots: [
          player.game_slot_1,
          player.game_slot_2,
          player.game_slot_3
        ]
      }
    else
      render json: { error: "Player not found" }, status: :not_found
    end
  end

  private

  def player_params
    params.require(:player).permit(:name, :username, :email, :password)
  end
end
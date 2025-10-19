class Api::GamesController < ApplicationController
  # GET /api/players/:username/games
  def index
    player = Player.find_by(username: params[:username])

    if player
      games = player.games.order(:slot_number).map do |game|
        {
          game_id: game.game_id,
          slot_number: game.slot_number,
          money: game.game_data["money"],
          day_count: game.game_data["day_count"],
          created_at: game.created_at,
          updated_at: game.updated_at
        }
      end

      render json: { games: games }
    else
      render json: { error: "Player not found" }, status: :not_found
    end
  end
  
  # GET /api/games/:game_id
  def show
    game = Game.find_by(game_id: params[:game_id])
    
    if game
      render json: {
        game_id: game.game_id,
        slot_number: game.slot_number,
        game_data: game.game_data,
        updated_at: game.updated_at
      }
    else
      render json: { error: "Game not found" }, status: :not_found
    end
  end
  
  # PATCH /api/games/:game_id
  def update
    game = Game.find_by(game_id: params[:game_id])
    
    if game
      if game.update(game_data: params[:game_data])
        render json: {
          message: "Game updated successfully",
          game_id: game.game_id,
          game_data: game.game_data,
          updated_at: game.updated_at
        }
      else
        render json: { errors: game.errors.full_messages }, status: :unprocessable_entity
      end
    else
      render json: { error: "Game not found" }, status: :not_found
    end
  end
  
  # DELETE /api/games/:game_id (optional - reset a game slot)
  def destroy
    game = Game.find_by(game_id: params[:game_id])

    if game
      # Reset to default instead of deleting
      if game.update(game_data: Game.default_game_data)
        render json: { message: "Game reset successfully" }
      else
        render json: { errors: game.errors.full_messages }, status: :unprocessable_entity
      end
    else
      render json: { error: "Game not found" }, status: :not_found
    end
  end

  # GET /api/leaderboard
  def leaderboard
    # Get all games with their total revenue and player info
    games = Game.joins(:player)
                .select("games.game_id, games.game_data, players.name")
                .map do |game|
      total_earned = game.game_data.dig("statistics", "total_earned") || 0.0
      {
        game_id: game.game_id,
        player_name: game.name,
        total_revenue: total_earned,
        day_count: game.game_data["day_count"] || 1,
        money: game.game_data["money"] || 0.0
      }
    end

    # Sort by total revenue descending
    sorted_games = games.sort_by { |g| -g[:total_revenue] }

    render json: { leaderboard: sorted_games }
  end
end
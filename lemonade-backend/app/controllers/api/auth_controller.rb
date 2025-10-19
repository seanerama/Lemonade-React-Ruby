class Api::AuthController < ApplicationController
  # POST /api/auth/login
  def login
    player = Player.find_by(username: params[:username])

    if player&.authenticate(params[:password])
      # Create a simple token (we'll use JWT later if needed)
      token = generate_token(player.username)

      render json: {
        message: "Login successful",
        token: token,
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
      }, status: :ok
    else
      render json: { error: "Invalid username or password" }, status: :unauthorized
    end
  end
  
  # POST /api/auth/logout
  def logout
    # For now, just return success (client will clear token)
    render json: { message: "Logout successful" }, status: :ok
  end
  
  # GET /api/auth/verify
  def verify
    # Verify if a token is valid
    token = request.headers['Authorization']&.split(' ')&.last

    if token
      username = decode_token(token)
      player = Player.find_by(username: username)

      if player
        render json: {
          valid: true,
          player: {
            username: player.username,
            email: player.email,
            name: player.name
          }
        }
      else
        render json: { valid: false }, status: :unauthorized
      end
    else
      render json: { valid: false }, status: :unauthorized
    end
  end

  private

  def generate_token(username)
    # Simple token for now - just Base64 encode the username with timestamp
    # In production, use JWT gem
    payload = { username: username, exp: 24.hours.from_now.to_i }
    Base64.strict_encode64(payload.to_json)
  end

  def decode_token(token)
    # Decode the simple token
    payload = JSON.parse(Base64.strict_decode64(token))

    # Check if expired
    if Time.at(payload['exp']) > Time.now
      payload['username']
    else
      nil
    end
  rescue
    nil
  end
end
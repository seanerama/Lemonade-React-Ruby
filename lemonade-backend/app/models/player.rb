class Player < ApplicationRecord
  has_secure_password

  has_many :games, foreign_key: :player_username, primary_key: :username, dependent: :destroy

  validates :username, presence: true, uniqueness: true,
            length: { minimum: 3, maximum: 20 },
            format: { with: /\A[a-zA-Z0-9_]+\z/, message: "only allows letters, numbers, and underscores" }
  validates :email,
            uniqueness: { allow_blank: true },
            allow_blank: true,
            format: { with: URI::MailTo::EMAIL_REGEXP, message: "must be a valid email" }, if: -> { email.present? }
  validates :name, presence: true
  validates :password, presence: true, length: { minimum: 6 }, if: :password_required?
  
  before_create :generate_game_slots
  after_create :create_default_games
  
  private
  
  def generate_game_slots
    self.game_slot_1 = generate_game_id
    self.game_slot_2 = generate_game_id
    self.game_slot_3 = generate_game_id
  end
  
  def generate_game_id
    # Characters excluding 0, o, O, 1, I, l
    chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    loop do
      game_id = 8.times.map { chars[rand(chars.length)] }.join
      return game_id unless Game.exists?(game_id: game_id)
    end
  end
  
  def create_default_games
    [game_slot_1, game_slot_2, game_slot_3].each_with_index do |slot_id, index|
      Game.create!(
        game_id: slot_id,
        player_username: username,
        slot_number: index + 1,
        game_data: Game.default_game_data
      )
    end
  end
  
  def password_required?
    password_digest.nil? || password.present?
  end
end
Rails.application.routes.draw do
  namespace :api do
    # Player registration
    post '/players', to: 'players#create'
    get '/players/:username', to: 'players#show'

    # Authentication
    post '/auth/login', to: 'auth#login'
    post '/auth/logout', to: 'auth#logout'
    get '/auth/verify', to: 'auth#verify'

    # Games
    get '/players/:username/games', to: 'games#index'
    get '/games/:game_id', to: 'games#show'
    patch '/games/:game_id', to: 'games#update'
    delete '/games/:game_id', to: 'games#destroy'

    # Leaderboard
    get '/leaderboard', to: 'games#leaderboard'
  end
end
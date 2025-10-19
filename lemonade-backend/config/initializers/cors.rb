Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Allow requests from frontend in development and production
    origins ENV.fetch("CORS_ORIGINS", "http://localhost:3000").split(",")

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end
end
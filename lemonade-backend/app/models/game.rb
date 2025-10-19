class Game < ApplicationRecord
  belongs_to :player, foreign_key: :player_username, primary_key: :username

  validates :game_id, presence: true, uniqueness: true, length: { is: 8 }
  validates :player_username, presence: true
  validates :slot_number, presence: true, inclusion: { in: 1..3 }
  validates :game_data, presence: true
  
  def self.default_game_data
    # Generate random events and weather for this game
    events_data = generate_game_events
    weather_data = generate_game_weather(events_data["heatwave_events"])

    {
      "money" => 50.00,
      "tip_jar" => 0.00,
      "day_count" => 1,
      "day_name" => "Monday",
      "month_name" => "March",
      "day_num" => 20,
      "month" => 3,
      "permits" => {},
      "events" => events_data,
      "weather" => {
        "current_temp" => weather_data[:starting_temp],
        "current_weather" => weather_data[:starting_weather],
        "weather_data" => weather_data[:weather_data]
      },
      "inventory" => {
        "lemons" => {"normal" => 0, "sour" => 0, "sweet" => 0},
        "sugar_lbs" => 0.0,
        "apples_lbs" => 0.0,
        "cups" => {"ten_oz" => 0, "sixteen_oz" => 0, "twentyfour_oz" => 0},
        "mugs_cinnamon" => 0,
        "containers" => {"one_gal" => 0, "five_gal" => 0, "barrel" => 0, "tanker" => 0},
        "lemonade_batches" => [],
        "cider_batches" => [],
        "juicer_level" => "hand"
      },
      "upgrades" => {
        "glass_dispenser" => false,
        "cash_drawer" => false,
        "pos_system" => false,
        "frozen_machine" => false,
        "second_location" => false,
        "chilled_dispenser" => false,
        "lemonade_robot" => false,
        "cider_maker" => false
      },
      "active_effects" => {
        "cashier_active" => false,
        "ad_campaign_active" => false,
        "ad_campaign_days_left" => 0,
        "ad_campaign_last_purchase_week" => 0,
        "second_location_uses_this_week" => 0,
        "second_location_week_reset_day" => 0,
        "sold_locations_today" => []
      },
      "reviews" => {
        "location_driveway" => {"rating" => 0.0, "count" => 0},
        "location_localpark" => {"rating" => 0.0, "count" => 0},
        "location_fleamarket" => {"rating" => 0.0, "count" => 0},
        "location_downtownpark" => {"rating" => 0.0, "count" => 0},
        "location_farmersmarket" => {"rating" => 0.0, "count" => 0},
        "location_conventioncenter" => {"rating" => 0.0, "count" => 0},
        "location_stadium" => {"rating" => 0.0, "count" => 0}
      },
      "statistics" => {
        "total_spent_grocery" => 0.0,
        "total_spent_supplies" => 0.0,
        "total_spent_permits" => 0.0,
        "total_spent_ads" => 0.0,
        "total_earned" => 0.0,
        "total_earned_location" => {
          "location_driveway" => 0.0,
          "location_localpark" => 0.0,
          "location_fleamarket" => 0.0,
          "location_downtownpark" => 0.0,
          "location_farmersmarket" => 0.0,
          "location_conventioncenter" => 0.0,
          "location_stadium" => 0.0
        },
        "total_served" => 0,
        "total_served_location" => {
          "location_driveway" => 0,
          "location_localpark" => 0,
          "location_fleamarket" => 0,
          "location_downtownpark" => 0,
          "location_farmersmarket" => 0,
          "location_conventioncenter" => 0,
          "location_stadium" => 0
        }
      }
    }
  end

  private

  # Generate events for a new game
  def self.generate_game_events(year = 2024)
    {
      "convention_events" => generate_convention_events(year),
      "stadium_events" => generate_stadium_events(year),
      "downtown_events" => generate_downtown_events(year),
      "heatwave_events" => generate_heatwave_events(year),
      "year" => year
    }
  end

  # Generate convention events (April-July, 3 days each)
  def self.generate_convention_events(year)
    events = []
    [4, 5, 6, 7].each do |month|
      start_day = rand(5..22)
      3.times do |i|
        day = start_day + i
        events << {
          "month" => month,
          "day" => day,
          "type" => "convention",
          "name" => convention_name(month)
        }
      end
    end
    events
  end

  # Generate stadium events (May-October, 2 days each, 4 per month)
  def self.generate_stadium_events(year)
    events = []
    [5, 6, 7, 8, 9, 10].each do |month|
      events_this_month = []
      attempts = 0
      while events_this_month.length < 8 && attempts < 100
        attempts += 1
        start_day = rand(1..26)
        has_conflict = events_this_month.any? { |e| (e["day"] - start_day).abs < 3 }

        unless has_conflict
          2.times do |i|
            events_this_month << {
              "month" => month,
              "day" => start_day + i,
              "type" => "stadium",
              "name" => stadium_name(month, events_this_month.length / 2)
            }
          end
        end
      end
      events.concat(events_this_month)
    end
    events
  end

  # Generate downtown events (March-October, weekly)
  def self.generate_downtown_events(year)
    events = []
    [3, 4, 5, 6, 7, 8, 9, 10].each do |month|
      days_in_month = Date.new(year, month, -1).day
      start_day = month == 3 ? 20 : 1
      current_day = start_day + rand(0..6)

      while current_day <= days_in_month
        events << {
          "month" => month,
          "day" => current_day,
          "type" => "downtown",
          "name" => downtown_name
        }
        current_day += 7
      end
    end
    events
  end

  # Generate heatwave events (June-August, 2-4 days each)
  def self.generate_heatwave_events(year)
    heatwaves = []
    [6, 7, 8].each do |month|
      num_heatwaves = rand < 0.6 ? 1 : 2
      used_days = Set.new

      num_heatwaves.times do
        duration = rand(2..4)
        attempts = 0

        loop do
          start_day = rand(1..25)
          attempts += 1
          break if attempts >= 20

          days_range = (start_day...(start_day + duration)).to_a
          next if days_range.any? { |d| used_days.include?(d) }

          days_range.each { |d| used_days.add(d) }
          heatwaves << {
            "month" => month,
            "start_day" => start_day,
            "end_day" => start_day + duration - 1,
            "duration" => duration,
            "type" => "heatwave",
            "name" => heatwave_name
          }
          break
        end
      end
    end
    heatwaves.sort_by { |hw| [hw["month"], hw["start_day"]] }
  end

  # Generate weather data for the entire season
  def self.generate_game_weather(heatwave_events)
    weather_data = []

    # Temperature ranges by month
    temp_ranges = {
      3 => { min: 45, max: 65 },
      4 => { min: 50, max: 70 },
      5 => { min: 60, max: 80 },
      6 => { min: 70, max: 90 },
      7 => { min: 75, max: 95 },
      8 => { min: 75, max: 95 },
      9 => { min: 65, max: 85 },
      10 => { min: 50, max: 70 }
    }

    # Weather type details (matching frontend WEATHER_TYPES)
    weather_types_info = {
      'sunny' => { 'name' => 'Sunny', 'icon' => '☀️', 'multiplier' => 1.5 },
      'partly_cloudy' => { 'name' => 'Partly Cloudy', 'icon' => '⛅', 'multiplier' => 1.2 },
      'cloudy' => { 'name' => 'Cloudy', 'icon' => '☁️', 'multiplier' => 1.0 },
      'rainy' => { 'name' => 'Rainy', 'icon' => '🌧️', 'multiplier' => 0.5 }
    }

    # Start with March 20
    current_temp = rand(50..60)

    # Generate for March 20 - October 31
    months = [
      [3, 20, 31], [4, 1, 30], [5, 1, 31], [6, 1, 30],
      [7, 1, 31], [8, 1, 31], [9, 1, 30], [10, 1, 31]
    ]

    months.each do |month, start_day, end_day|
      (start_day..end_day).each do |day|
        # Check if this is a heatwave day
        is_heatwave = heatwave_events.any? do |hw|
          hw["month"] == month && day >= hw["start_day"] && day <= hw["end_day"]
        end

        # Adjust temperature for heatwave
        if is_heatwave
          current_temp = [current_temp, 90].max + rand(0..5)
        else
          # Normal temperature variation
          range = temp_ranges[month]
          change = [-5, -3, -1, 0, 1, 3, 5].sample
          current_temp = [[current_temp + change, range[:min]].max, range[:max]].min
        end

        # Generate weather based on temperature
        weather_type = if current_temp > 85
          ['sunny', 'sunny', 'sunny', 'partly_cloudy'].sample
        elsif current_temp < 55
          ['partly_cloudy', 'cloudy', 'rainy'].sample
        else
          ['sunny', 'partly_cloudy', 'cloudy'].sample
        end

        weather_data << {
          "month" => month,
          "day" => day,
          "temp" => current_temp,
          "weatherType" => weather_type,
          "isHeatwave" => is_heatwave,
          "weather" => weather_types_info[weather_type]
        }
      end
    end

    # Return starting conditions plus full weather data
    {
      starting_temp: weather_data.first["temp"],
      starting_weather: weather_data.first["weatherType"],
      weather_data: weather_data
    }
  end

  # Event name helpers
  def self.convention_name(month)
    {
      4 => 'Spring Tech Expo',
      5 => 'Regional Business Summit',
      6 => 'Summer Innovation Conference',
      7 => 'Annual Trade Show'
    }[month] || 'Convention'
  end

  def self.stadium_name(month, index)
    names = {
      5 => ['Opening Day', 'Memorial Day Tournament', 'Spring Classic', 'Rivalry Weekend'],
      6 => ['Summer Series', 'Championship Qualifier', 'All-Star Weekend', 'Pride Festival'],
      7 => ['Independence Day Game', 'Mid-Season Showdown', 'Summer Bash', 'League Finals'],
      8 => ['Playoff Opener', 'Championship Series', 'Summer Finale', 'Tournament Finals'],
      9 => ['Fall Classic', 'Homecoming Game', 'Rivalry Match', 'Season Closer'],
      10 => ['Championship Game', 'World Series', 'Grand Final', 'Trophy Match']
    }
    month_names = names[month] || ['Game Day']
    month_names[index % month_names.length]
  end

  def self.downtown_name
    [
      'Food Truck Festival', 'Outdoor Concert Series', 'Art in the Park',
      'Community Yoga Day', 'Local Craft Fair', 'Live Music Fest',
      'Street Food Market', 'Outdoor Movie Night', 'Fitness Bootcamp',
      'Cultural Festival'
    ].sample
  end

  def self.heatwave_name
    [
      'Summer Scorcher', 'Heat Advisory Issued', 'Record Temperatures Expected',
      'Excessive Heat Warning', 'Triple Digit Temps Forecasted', 'Heat Dome Arrives',
      'Sweltering Conditions Continue', 'Dangerous Heat Wave Alert'
    ].sample
  end
end
const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Synset V Booking API",
    version: "1.1.0",
    description:
      "API documentation for the Villa Elara backend with endpoint-specific request and response schemas.",
  },
  servers: [],
  tags: [
    { name: "System" },
    { name: "Auth" },
    { name: "Public" },
    { name: "Admin" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      FieldError: {
        type: "object",
        properties: {
          field: { type: "string", example: "checkOut" },
          message: { type: "string", example: "Check-out must be after check-in" },
        },
        required: ["field", "message"],
      },
      ErrorResponse: {
        type: "object",
        properties: {
          errors: {
            type: "array",
            items: { $ref: "#/components/schemas/FieldError" },
          },
        },
        required: ["errors"],
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
        },
        required: ["status"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          username: { type: "string" },
          password: { type: "string" },
        },
        required: ["username", "password"],
      },
      LoginResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              token: { type: "string" },
            },
            required: ["token"],
          },
        },
        required: ["data"],
      },
      VillaImage: {
        type: "object",
        properties: {
          id: { type: "integer" },
          villaId: { type: "integer" },
          imageUrl: { type: "string" },
          altText: { type: "string" },
          displayOrder: { type: "integer" },
          isHero: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "villaId",
          "imageUrl",
          "altText",
          "displayOrder",
          "isHero",
          "createdAt",
        ],
      },
      Villa: {
        type: "object",
        properties: {
          id: { type: "integer" },
          nameEn: { type: "string" },
          nameEl: { type: "string", nullable: true },
          descriptionEn: { type: "string" },
          descriptionEl: { type: "string", nullable: true },
          shortDescriptionEn: { type: "string" },
          shortDescriptionEl: { type: "string", nullable: true },
          bedrooms: { type: "integer" },
          bathrooms: { type: "integer" },
          maxGuests: { type: "integer" },
          basePricePerNight: { type: "string", example: "250.00" },
          currency: { type: "string", example: "EUR" },
          touristTaxPerNight: { type: "string", example: "15.00" },
          minNights: { type: "integer" },
          maxNights: { type: "integer", nullable: true },
          checkInTime: { type: "string", example: "15:00" },
          checkOutTime: { type: "string", example: "11:00" },
          address: { type: "string" },
          latitude: { type: "string", nullable: true },
          longitude: { type: "string", nullable: true },
          amenitiesEn: {
            type: "array",
            items: { type: "string" },
          },
          amenitiesEl: {
            type: "array",
            nullable: true,
            items: { type: "string" },
          },
          houseRulesEn: { type: "string", nullable: true },
          houseRulesEl: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          images: {
            type: "array",
            items: { $ref: "#/components/schemas/VillaImage" },
          },
        },
        required: [
          "id",
          "nameEn",
          "descriptionEn",
          "shortDescriptionEn",
          "bedrooms",
          "bathrooms",
          "maxGuests",
          "basePricePerNight",
          "currency",
          "touristTaxPerNight",
          "minNights",
          "checkInTime",
          "checkOutTime",
          "address",
          "amenitiesEn",
          "createdAt",
          "updatedAt",
          "images",
        ],
      },
      VillaResponse: {
        type: "object",
        properties: {
          data: { $ref: "#/components/schemas/Villa" },
        },
        required: ["data"],
      },
      UpdateVillaRequest: {
        type: "object",
        properties: {
          nameEn: { type: "string" },
          nameEl: { type: "string", nullable: true },
          descriptionEn: { type: "string" },
          descriptionEl: { type: "string", nullable: true },
          shortDescriptionEn: { type: "string" },
          shortDescriptionEl: { type: "string", nullable: true },
          bedrooms: { type: "integer", minimum: 1 },
          bathrooms: { type: "integer", minimum: 1 },
          maxGuests: { type: "integer", minimum: 1 },
          basePricePerNight: { type: "number", minimum: 0 },
          currency: { type: "string" },
          touristTaxPerNight: { type: "number", minimum: 0 },
          minNights: { type: "integer", minimum: 1 },
          maxNights: { type: "integer", minimum: 1, nullable: true },
          checkInTime: { type: "string", example: "15:00" },
          checkOutTime: { type: "string", example: "11:00" },
          address: { type: "string" },
          latitude: { type: "number", nullable: true },
          longitude: { type: "number", nullable: true },
          amenitiesEn: {
            type: "array",
            items: { type: "string" },
          },
          amenitiesEl: {
            type: "array",
            nullable: true,
            items: { type: "string" },
          },
          houseRulesEn: { type: "string", nullable: true },
          houseRulesEl: { type: "string", nullable: true },
        },
      },
      AvailabilityDate: {
        type: "object",
        properties: {
          date: { type: "string", format: "date" },
          available: { type: "boolean" },
          price: { type: "string", nullable: true, example: "300.00" },
          reason: { type: "string", nullable: true },
        },
        required: ["date", "available", "price", "reason"],
      },
      AvailabilityResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              villaId: { type: "integer" },
              minNights: { type: "integer" },
              maxNights: { type: "integer", nullable: true },
              dates: {
                type: "array",
                items: { $ref: "#/components/schemas/AvailabilityDate" },
              },
            },
            required: ["villaId", "minNights", "maxNights", "dates"],
          },
        },
        required: ["data"],
      },
      PricingNight: {
        type: "object",
        properties: {
          date: { type: "string", format: "date" },
          price: { type: "string", example: "280.00" },
          ruleName: { type: "string", nullable: true },
        },
        required: ["date", "price", "ruleName"],
      },
      PricingResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              numNights: { type: "integer" },
              nights: {
                type: "array",
                items: { $ref: "#/components/schemas/PricingNight" },
              },
              accommodationTotal: { type: "string", example: "1120.00" },
              nightlyRate: { type: "string", example: "280.00" },
              touristTaxPerNight: { type: "string", example: "15.00" },
              touristTaxTotal: { type: "string", example: "60.00" },
              totalPrice: { type: "string", example: "1180.00" },
            },
            required: [
              "numNights",
              "nights",
              "accommodationTotal",
              "nightlyRate",
              "touristTaxPerNight",
              "touristTaxTotal",
              "totalPrice",
            ],
          },
        },
        required: ["data"],
      },
      BookingStatus: {
        type: "string",
        enum: ["pending", "confirmed", "completed", "cancelled"],
      },
      Booking: {
        type: "object",
        properties: {
          id: { type: "integer" },
          villaId: { type: "integer" },
          referenceCode: { type: "string" },
          guestName: { type: "string" },
          guestEmail: { type: "string", format: "email" },
          guestPhone: { type: "string" },
          checkIn: { type: "string", format: "date-time" },
          checkOut: { type: "string", format: "date-time" },
          numGuests: { type: "integer" },
          numNights: { type: "integer" },
          nightlyRate: { type: "string", example: "250.00" },
          touristTaxTotal: { type: "string", example: "60.00" },
          totalPrice: { type: "string", example: "1060.00" },
          depositAmount: { type: "string", nullable: true },
          paymentStatus: { type: "string", example: "unpaid" },
          status: { $ref: "#/components/schemas/BookingStatus" },
          adminNotes: { type: "string", nullable: true },
          guestMessage: { type: "string", nullable: true },
          cancellationReason: { type: "string", nullable: true },
          confirmedAt: { type: "string", format: "date-time", nullable: true },
          cancelledAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "villaId",
          "referenceCode",
          "guestName",
          "guestEmail",
          "guestPhone",
          "checkIn",
          "checkOut",
          "numGuests",
          "numNights",
          "nightlyRate",
          "touristTaxTotal",
          "totalPrice",
          "paymentStatus",
          "status",
          "createdAt",
          "updatedAt",
        ],
      },
      BookingVillaSummary: {
        type: "object",
        properties: {
          nameEn: { type: "string" },
        },
        required: ["nameEn"],
      },
      BookingVillaDetails: {
        type: "object",
        properties: {
          nameEn: { type: "string" },
          address: { type: "string" },
          checkInTime: { type: "string" },
          checkOutTime: { type: "string" },
        },
        required: ["nameEn", "address", "checkInTime", "checkOutTime"],
      },
      BookingWithVillaSummary: {
        allOf: [
          { $ref: "#/components/schemas/Booking" },
          {
            type: "object",
            properties: {
              villa: { $ref: "#/components/schemas/BookingVillaSummary" },
            },
            required: ["villa"],
          },
        ],
      },
      BookingWithVillaDetails: {
        allOf: [
          { $ref: "#/components/schemas/Booking" },
          {
            type: "object",
            properties: {
              villa: { $ref: "#/components/schemas/BookingVillaDetails" },
            },
            required: ["villa"],
          },
        ],
      },
      CreateBookingRequest: {
        type: "object",
        properties: {
          checkIn: { type: "string", format: "date" },
          checkOut: { type: "string", format: "date" },
          numGuests: { type: "integer", minimum: 1 },
          guestName: { type: "string" },
          guestEmail: { type: "string", format: "email" },
          guestPhone: { type: "string" },
          guestMessage: { type: "string" },
        },
        required: [
          "checkIn",
          "checkOut",
          "numGuests",
          "guestName",
          "guestEmail",
          "guestPhone",
        ],
      },
      CreateBookingResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              booking: { $ref: "#/components/schemas/Booking" },
              pricing: {
                type: "object",
                properties: {
                  numNights: { type: "integer" },
                  nights: {
                    type: "array",
                    items: { $ref: "#/components/schemas/PricingNight" },
                  },
                  accommodationTotal: { type: "string" },
                  touristTaxTotal: { type: "string" },
                  totalPrice: { type: "string" },
                },
                required: [
                  "numNights",
                  "nights",
                  "accommodationTotal",
                  "touristTaxTotal",
                  "totalPrice",
                ],
              },
            },
            required: ["booking", "pricing"],
          },
        },
        required: ["data"],
      },
      BookingByReferenceResponse: {
        type: "object",
        properties: {
          data: { $ref: "#/components/schemas/BookingWithVillaDetails" },
        },
        required: ["data"],
      },
      BookingByIdResponse: {
        type: "object",
        properties: {
          data: { $ref: "#/components/schemas/BookingWithVillaDetails" },
        },
        required: ["data"],
      },
      BookingMutationResponse: {
        type: "object",
        properties: {
          data: { $ref: "#/components/schemas/Booking" },
        },
        required: ["data"],
      },
      BookingListResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              bookings: {
                type: "array",
                items: { $ref: "#/components/schemas/BookingWithVillaSummary" },
              },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "integer" },
                  limit: { type: "integer" },
                  total: { type: "integer" },
                  totalPages: { type: "integer" },
                },
                required: ["page", "limit", "total", "totalPages"],
              },
            },
            required: ["bookings", "pagination"],
          },
        },
        required: ["data"],
      },
      ConfirmBookingRequest: {
        type: "object",
        properties: {
          adminNotes: { type: "string" },
        },
      },
      CancelBookingRequest: {
        type: "object",
        properties: {
          cancellationReason: { type: "string" },
        },
        required: ["cancellationReason"],
      },
      BookingStatsResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              bookings: {
                type: "object",
                properties: {
                  pending: { type: "integer" },
                  confirmed: { type: "integer" },
                  completed: { type: "integer" },
                  cancelled: { type: "integer" },
                  total: { type: "integer" },
                },
                required: ["pending", "confirmed", "completed", "cancelled", "total"],
              },
              revenue: {
                type: "object",
                properties: {
                  total: { type: "string", example: "12500.00" },
                  thisMonth: { type: "string", example: "2500.00" },
                  lastMonth: { type: "string", example: "3000.00" },
                },
                required: ["total", "thisMonth", "lastMonth"],
              },
              occupancy: {
                type: "object",
                properties: {
                  bookedNightsThisMonth: { type: "integer" },
                  daysInThisMonth: { type: "integer" },
                  rate: { type: "number", example: 66.7, description: "Occupancy rate as a percentage (0–100)" },
                },
                required: ["bookedNightsThisMonth", "daysInThisMonth", "rate"],
              },
              averages: {
                type: "object",
                properties: {
                  bookingValue: { type: "string", example: "1250.00" },
                  lengthOfStay: { type: "number", example: 5.2 },
                },
                required: ["bookingValue", "lengthOfStay"],
              },
              upcomingCheckIns: { type: "integer", description: "Confirmed or pending check-ins in the next 30 days" },
            },
            required: ["bookings", "revenue", "occupancy", "averages", "upcomingCheckIns"],
          },
        },
        required: ["data"],
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Admin login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/villa": {
      get: {
        tags: ["Public"],
        summary: "Get villa details",
        responses: {
          "200": {
            description: "Villa details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VillaResponse" },
              },
            },
          },
          "404": {
            description: "Villa not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/availability": {
      get: {
        tags: ["Public"],
        summary: "Get availability calendar",
        parameters: [
          {
            in: "query",
            name: "from",
            required: true,
            schema: { type: "string", format: "date" },
            description: "Start date in YYYY-MM-DD",
          },
          {
            in: "query",
            name: "to",
            required: true,
            schema: { type: "string", format: "date" },
            description: "End date in YYYY-MM-DD",
          },
        ],
        responses: {
          "200": {
            description: "Availability and prices by date",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AvailabilityResponse" },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Villa not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/pricing": {
      get: {
        tags: ["Public"],
        summary: "Get price quote for date range",
        parameters: [
          {
            in: "query",
            name: "from",
            required: true,
            schema: { type: "string", format: "date" },
            description: "Check-in date in YYYY-MM-DD",
          },
          {
            in: "query",
            name: "to",
            required: true,
            schema: { type: "string", format: "date" },
            description: "Check-out date in YYYY-MM-DD",
          },
        ],
        responses: {
          "200": {
            description: "Pricing breakdown",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PricingResponse" },
              },
            },
          },
          "400": {
            description: "Invalid date range or validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Villa not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/bookings": {
      post: {
        tags: ["Public"],
        summary: "Create booking request",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateBookingRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Booking created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateBookingResponse" },
              },
            },
          },
          "400": {
            description: "Validation or business rule error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Villa not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/bookings/{referenceCode}": {
      get: {
        tags: ["Public"],
        summary: "Get booking by reference code",
        parameters: [
          {
            in: "path",
            name: "referenceCode",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Booking details",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/BookingByReferenceResponse",
                },
              },
            },
          },
          "404": {
            description: "Booking not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/admin/villa": {
      put: {
        tags: ["Admin"],
        summary: "Update villa",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateVillaRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Villa updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VillaResponse" },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Villa not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/admin/bookings": {
      get: {
        tags: ["Admin"],
        summary: "List bookings",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "status",
            required: false,
            schema: {
              type: "string",
              enum: ["pending", "confirmed", "completed", "cancelled"],
            },
          },
          {
            in: "query",
            name: "page",
            required: false,
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            in: "query",
            name: "limit",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          "200": {
            description: "Bookings list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BookingListResponse" },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/admin/bookings/{id}": {
      get: {
        tags: ["Admin"],
        summary: "Get booking by id",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "Booking details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BookingByIdResponse" },
              },
            },
          },
          "400": {
            description: "Invalid booking id",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Booking not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/admin/bookings/{id}/confirm": {
      patch: {
        tags: ["Admin"],
        summary: "Confirm booking",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ConfirmBookingRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Booking confirmed",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/BookingMutationResponse",
                },
              },
            },
          },
          "400": {
            description: "Invalid booking state or input",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/admin/bookings/{id}/cancel": {
      patch: {
        tags: ["Admin"],
        summary: "Cancel booking",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CancelBookingRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Booking cancelled",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/BookingMutationResponse",
                },
              },
            },
          },
          "400": {
            description: "Invalid booking state or input",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/admin/bookings/{id}/complete": {
      patch: {
        tags: ["Admin"],
        summary: "Complete booking",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "Booking completed",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/BookingMutationResponse",
                },
              },
            },
          },
          "400": {
            description: "Invalid booking state or input",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/admin/stats": {
      get: {
        tags: ["Admin"],
        summary: "Get booking KPI stats",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Booking statistics",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BookingStatsResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/admin/bookings/export": {
      get: {
        tags: ["Admin"],
        summary: "Export bookings as CSV",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "status",
            required: false,
            schema: {
              type: "string",
              enum: ["pending", "confirmed", "completed", "cancelled"],
            },
          },
          {
            in: "query",
            name: "from",
            required: false,
            schema: { type: "string", format: "date" },
            description: "Filter by check-in from date (YYYY-MM-DD)",
          },
          {
            in: "query",
            name: "to",
            required: false,
            schema: { type: "string", format: "date" },
            description: "Filter by check-in to date (YYYY-MM-DD)",
          },
        ],
        responses: {
          "200": {
            description: "CSV file download",
            content: {
              "text/csv": {
                schema: { type: "string" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
} as const;

export default openApiDocument;
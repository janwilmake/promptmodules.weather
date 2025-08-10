This API provides markdown-based weather context about any prompt using the https://open-meteo.com API.

It works by passing `?q=<encoded_prompt>`. Additionally, it will look at `request.cf` to roughly see the location the request originated from (or you can pass `x-cf-data` header to overwrite this data, if you use this API from a server).

Context:

- https://openweathermap.org/bulk#list would be useful but it's $400/month
- https://open-meteo.com provides super fast and free api for non-commercial use up to 10k api calls a day

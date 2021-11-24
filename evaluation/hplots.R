options(scipen=999)

d <- read.csv("results.csv")
d <- d[d$Warmup == "false",]

df <- d %>%
  group_by(Query, Terminate.early, Threshold) %>% 
  summarize(min_time = min(Time), max_time = max(Time), mean_time = mean(Time), size=mean(Size), stdev=sd(Time))

df

q = "extremeBlowupQuery6.graphql"
title = "Extreme Blowup: Q6"

data <- df[df$Query==q,]
data <- data[data$Threshold==1000,] # or 10000 or 999999999

data <- rbind(data,data)

ze_barplot <- barplot(data$mean_time, names=data$Terminate.early, beside=T, space=c(0.2,0,0.2,0), legend.text=F,
                      col=c("blue" , "skyblue"), ylim=c(0, 1.2*max(data$mean_time)))

error.bar(ze_barplot, data$mean_time, data$stdev)
mtext(title, line=2.4, side=1)
legend("top",  fill=c("blue" , "skyblue"), col=c("foo", "bar"), legend=c("Baseline", "Early termination")  );

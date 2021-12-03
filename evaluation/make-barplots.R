options(scipen=999)
library(ggplot2)
require(plyr)
df <- read.csv("results.csv", header = T)
df <- df[df$Warmup == "false",]
df$Time <- as.numeric(as.character(df$Time))
df$Pending_Promize_Time <- as.numeric(as.character(df$Pending_Promize_Time))

data_summary <- function(data, varname, groupnames){
  summary_func <- function(x, col){
    c(mean = mean(x[[col]], na.rm=TRUE),
      min = min(x[[col]], na.rm=TRUE),
      max = max(x[[col]], na.rm=TRUE),
      sd = sd(x[[col]], na.rm=TRUE),
      Pending_Promize_Time = mean(x[["Pending_Promize_Time"]], na.rm=TRUE) # hack
      )
  }
  data_sum<-ddply(data, groupnames, .fun=summary_func, varname)
  data_sum <- rename(data_sum, c("mean" = varname))
  return(data_sum)
}
df2 <- data_summary(df, "Time", c("Query", "Threshold", "Terminate_early"))
write.csv(df2,"results-summary.csv", row.names = FALSE)
head(df2)

for(myfilter in c("extreme")){ #c("acyclic", "cyclic", "blowup", "extreme", "varying")){
  for(limit in unique(df2$Threshold)){
    df3 <- df2[df2$Threshold==limit,]
    df3 <- dplyr::filter(df3, grepl(paste("^", myfilter, sep=""), Query))
    head(df3)
    p <- ggplot(df3, aes(x=Query, y=Time, fill=Terminate_early)) + 
      geom_bar(stat="identity", color="black", position=position_dodge()) +
      geom_errorbar(aes(ymin=Time-sd, ymax=Time+sd), width=.2, position=position_dodge(.9)) +
      ggtitle(paste(myfilter, "with", limit))
    ggsave(paste("plots/", myfilter, "-", limit, ".pdf", sep=""), p)
    print(p)
  }
}



# The latter part of this script is used to create a stacked bar plot that visualizes
# the propotion of time spent on 
# pending promises
early <- df2[df2$Terminate_early == "true",]
early$diff <- early$Time - early$Pending_Promize_Time

d1 <- data.frame(early$Query, early$diff, c('Useful'), early$Threshold)
names(d1) <- c("Query","Time","Work","Threshold")
d2 <- data.frame(early$Query, early$Pending_Promize_Time, c('Wasted'),early$Threshold)
names(d2) <- c("Query","Time","Work","Threshold")
d3 <- rbind(d1, d2)
d3
# Stacked bars
for(myfilter in c("extreme")){ #c("acyclic", "cyclic", "blowup", "extreme", "varying")){
  for(limit in unique(d3$Threshold)){
    dd <- d3[d3$Threshold==limit,]
    dd <- dplyr::filter(dd, grepl(paste("^", myfilter, sep=""), Query))
    p <- ggplot(dd, aes(fill=Work, y=Time, x=Query)) + 
      geom_bar(position="stack", stat="identity") +
      ggtitle(paste(myfilter, "stacked with", limit, sep="-"))
    ggsave(paste("plots/", myfilter, "-stacked-", limit, ".pdf", sep=""), p)
    print(p)
  }
}


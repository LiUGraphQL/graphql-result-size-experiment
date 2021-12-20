options(scipen=999)
library(ggplot2)
require(plyr)

df <- read.csv("results.csv", header = T)
head(df)
df <- df[df$warmup == "false",]
df[df=="NA"]<- NA
df$threshold <- as.numeric(as.character(df$threshold))
df$resultSize <- as.numeric(as.character(df$resultSize))
df$resultSizeLimit <- as.numeric(as.character(df$resultSizeLimit))
df$timeout <- as.numeric(as.character(df$timeout))
df$calculationTime <- as.numeric(as.character(df$calculationTime))
df$resultTime <- as.numeric(as.character(df$resultTime))
df$responseTime <- as.numeric(as.character(df$responseTime))
df$waitingOnPromises <- as.numeric(as.character(df$waitingOnPromises))

data_summary <- function(data, varname, groupnames){
  summary_func <- function(x, col){
    c(mean = mean(x[[col]], na.rm=TRUE),
      min = min(x[[col]], na.rm=TRUE),
      max = max(x[[col]], na.rm=TRUE),
      sd = sd(x[[col]], na.rm=TRUE)
      )
  }
  data_sum<-ddply(data, groupnames, .fun=summary_func, varname)
  data_sum <- rename(data_sum, c("mean" = varname))
  return(data_sum)
}

df_responseTime <- data_summary(df, "responseTime", c("queryFile", "threshold", "terminateEarly"))
df_responseTime$threshold[is.na(df_responseTime$threshold)] <- 10000
df_responseTime

#write.csv(df_resultTime,"results-summary.csv", row.names = FALSE)
head(df_responseTime)

for(query in unique(df_responseTime$queryFile)){
  for(limit in unique(df_responseTime$threshold)){
    if(is.na(limit)) {
      next
    }
    d <- df_responseTime[df_responseTime$threshold==limit,]
    d <- dplyr::filter(d, grepl(paste("^", query, sep=""), queryFile))
    
    stringr::str_split(query, "\\.")[0]
    title <- gsub("\\.graphql$", "", query)
    p <- ggplot(d, aes(x=queryFile, y=responseTime, fill=terminateEarly)) + 
      geom_bar(stat="identity", color="black", position=position_dodge()) +
      geom_errorbar(aes(ymin=responseTime-sd*1.6, ymax=responseTime+sd*1.6), width=.2, position=position_dodge(.9)) +
      ggtitle(paste(title, "with", limit)) + 
      scale_y_continuous(trans='log2')
    ggplot(df,aes(x,y))+geom_point()+geom_hline(yintercept=0.5)
    ggsave(paste("plots/", title, "-limit-", limit, ".pdf", sep=""), p)
    print(p)
  }
}













# NOT UPDATED WITH NEW COL NAMES
# The latter part of this script is used to create a stacked bar plot that visualizes
# the propotion of time spent on 
# pending promises
early <- df2[df2$Terminate_early == "true",]
early$diff <- early$Time - early$Waiting_On_Promises
early
d1 <- data.frame(early$Query, early$diff, c('Useful'), early$Threshold)
names(d1) <- c("Query","Time","Work","Threshold")
d2 <- data.frame(early$Query, early$Waiting_On_Promises, c('Wasted'),early$Threshold)
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

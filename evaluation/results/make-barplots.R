options(scipen=999)
library(ggplot2)
require(plyr)

# Multiple plot function
#
# ggplot objects can be passed in ..., or to plotlist (as a list of ggplot objects)
# - cols:   Number of columns in layout
# - layout: A matrix specifying the layout. If present, 'cols' is ignored.
#
# If the layout is something like matrix(c(1,2,3,3), nrow=2, byrow=TRUE),
# then plot 1 will go in the upper left, 2 will go in the upper right, and
# 3 will go all the way across the bottom.
#
multiplot <- function(..., plotlist=NULL, file, cols=1, layout=NULL) {
  library(grid)
  
  # Make a list from the ... arguments and plotlist
  plots <- c(list(...), plotlist)
  
  numPlots = length(plots)
  
  # If layout is NULL, then use 'cols' to determine layout
  if (is.null(layout)) {
    # Make the panel
    # ncol: Number of columns of plots
    # nrow: Number of rows needed, calculated from # of cols
    layout <- matrix(seq(1, cols * ceiling(numPlots/cols)),
                     ncol = cols, nrow = ceiling(numPlots/cols))
  }
  
  if (numPlots==1) {
    print(plots[[1]])
    
  } else {
    # Set up the page
    grid.newpage()
    pushViewport(viewport(layout = grid.layout(nrow(layout), ncol(layout))))
    
    # Make each plot, in the correct location
    for (i in 1:numPlots) {
      # Get the i,j matrix positions of the regions that contain this subplot
      matchidx <- as.data.frame(which(layout == i, arr.ind = TRUE))
      
      print(plots[[i]], vp = viewport(layout.pos.row = matchidx$row,
                                      layout.pos.col = matchidx$col))
    }
  }
}


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
      Waiting_On_Promises = mean(x[["Waiting_On_Promises"]], na.rm=TRUE) # hack
      )
  }
  data_sum<-ddply(data, groupnames, .fun=summary_func, varname)
  data_sum <- rename(data_sum, c("mean" = varname))
  return(data_sum)
}
df2 <- data_summary(df, "Time", c("Query", "Threshold", "Terminate_early"))
write.csv(df2,"results-summary.csv", row.names = FALSE)
head(df2)
df2

for(query in unique(df2$Query)){
  plots <- list()
  for(limit in unique(df2$Threshold)){
    df3 <- df2[df2$Threshold==limit,]
    df3 <- dplyr::filter(df3, grepl(paste("^", query, sep=""), Query))
    
    stringr::str_split(query, "\\.")[0]
    title <- gsub("\\.graphql$", "", query)
    p <- ggplot(df3, aes(x=Query, y=Time, fill=Terminate_early)) + 
      geom_bar(stat="identity", color="black", position=position_dodge()) +
      geom_errorbar(aes(ymin=Time-sd*1.6, ymax=Time+sd*1.6), width=.2, position=position_dodge(.9)) +
      ggtitle(paste(title, "with", limit))
    ggsave(paste("plots/", title, "-limit-", limit, ".pdf", sep=""), p)
    #print(p)
    #plots[[length(plots) + 1]] <- p
  }
  #multiplot(plotlist=plots, cols=3)
}

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

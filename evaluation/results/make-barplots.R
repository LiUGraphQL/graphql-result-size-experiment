# Notes:
# blowupQuery4 with standard executor did not complete in given time (infinte) and memory constraints (16GB)
# due to internal server error.
# Export data frame using:
# write.csv(df_resultTime,"results-summary.csv", row.names = FALSE)

options(scipen=999)
library(ggplot2)
require(plyr)
require(dplyr)
library(scales)

# load data
df <- read.csv("results.csv", header = T)
# remove warmup runs
df <- df[df$warmup == "false",]

# replace 'NA' with NA
df[df=="NA"]<- NA

# set cols as numeric
df$threshold <- as.numeric(as.character(df$threshold))
df$resultSize <- as.numeric(as.character(df$resultSize))
df$resultSizeLimit <- as.numeric(as.character(df$resultSizeLimit))
df$timeout <- as.numeric(as.character(df$timeout))
df$calculationTime <- as.numeric(as.character(df$calculationTime))
df$resultTime <- as.numeric(as.character(df$resultTime))
df$responseTime <- as.numeric(as.character(df$responseTime))
df$waitingOnPromises <- as.numeric(as.character(df$waitingOnPromises))

data_summary_multi <- function(data, varnames, groupnames){
  summary_func <- function(x, col){
    x <- c(mean = mean(x[[col]], na.rm=TRUE),
      sd = sd(x[[col]], na.rm=TRUE),
      count = length(x[[col]])
    )
    names(x)[names(x) == "mean"] <- paste(varname, "_mean", sep="")
    names(x)[names(x) == "sd"] <- paste(varname, "_sd", sep="")
    return(x)
    
  }
  data_sum <- NULL
  for(varname in varnames){
    if(is.null(data_sum)){
      data_sum<-ddply(data, groupnames, .fun=summary_func, varname)
    } else {
      data_sum <- merge(data_sum, ddply(data, groupnames, .fun=summary_func, varname))
    }
  }
  return(data_sum)
}

# k scale
ks <- function (x) { number_format(accuracy = 1,
                                   scale = 1/1000,
                                   suffix = "k",
                                   big.mark = ",")(x) }

standard_vs_calculator <- function(){
  ### Compare calculator with standard executor (no threshold, timeout 2 min) ###
  # calculation time: before result generated (NA for standard executor)
  # result time:      after result generated (NA for standard executor)
  # response time:    client query response time 
  # cols: resultSize (mean, stddev), responseTime (mean, stddev), queryFile, queryDir, useQueryCalculator
  df_calc_vs_standard <-
    data_summary_multi(filter(df, is.na(threshold) | (useQueryCalculator == 'true' & threshold == 999999999)),
      c("responseTime"),  # summarize vars
      c("queryDir", "queryFile", "useQueryCalculator", "threshold") # group by
    )
  for(q in unique(df_calc_vs_standard$queryFile)){
    # grab data for a specific query file
    d <- dplyr::filter(df_calc_vs_standard, grepl(paste("^", q, sep=""), queryFile))
    # update title
    title <- gsub("\\.graphql$", "", q)
    p <- ggplot(d, aes(x=queryFile, y=responseTime_mean, fill=useQueryCalculator)) + 
      geom_bar(stat="identity", color="black", position=position_dodge()) +
      geom_errorbar(aes(ymin=responseTime_mean-responseTime_sd, ymax=responseTime_mean+responseTime_sd), width=.2, position=position_dodge(.9)) +
      ggtitle(paste("Query:", title)) +
      labs(y="Response Time (ms)", x="Standard vs. Calculate") +
      theme(axis.text.x = element_blank(),
            axis.title.x = element_blank(),
            legend.title=element_blank()
            ) +
      scale_fill_discrete(labels = c("Standard", "Calculate")) +
      scale_y_continuous(expand = c(0, 0), limits=c(0, max(d$responseTime_mean + d$responseTime_sd)*1.1))
    print(p)
    ggsave(paste("plots/ResponseTime/Standard_vs_Calculate/", title, ".pdf", sep=""), p)
  }
}
standard_vs_calculator()
calculator_vs_early_termination <- function(){
  ### Compare calculator and calculator with early termination with standard executor with response time (with thresholds, timeout 2 min) ###
  df_calc_vs_early <-
    data_summary_multi(filter(df, !is.na(threshold) & useQueryCalculator == 'true' & threshold != 999999999),
                       c("responseTime"),  # summarize vars
                       c("queryFile", "terminateEarly", "threshold") # group by
    )
  
  
  for(q in unique(df_calc_vs_early$queryFile)){
    # grab data for a specific query file
    d <- dplyr::filter(df_calc_vs_early, grepl(paste("^", q, sep=""), queryFile))
    # update title
    title <- gsub("\\.graphql$", "", q)
    p <-
      ggplot(data=d, aes(x=threshold, y=responseTime_mean, fill=terminateEarly)) +
      geom_bar(stat="identity", color="black", position=position_dodge()) +
      geom_errorbar(aes(ymin=responseTime_mean-responseTime_sd, ymax=responseTime_mean+responseTime_sd), position=position_dodge()) +
      ggtitle(paste("Query:", title)) +
      labs(y="Response Time (ms)", x="Threshold") +
      scale_fill_discrete(labels = c("Calculator", "Early Termination")) +
      theme(legend.title=element_blank())
      #scale_y_continuous(expand = c(0, 0), limits=c(0, max(d$responseTime_mean + d$responseTime_sd)*1.1))
  
    print(p)
    ggsave(paste("plots/ResponseTime/All/", title, ".pdf", sep=""), p)
  }
}
calculator_vs_early_termination()
calculator_vs_early_termination_above_threshold <- function(){
  ### Compare calculator and calculator with early termination with response time (with thresholds, timeout 2 min) ###
  df_calc_vs_early <-
    data_summary_multi(filter(df, !is.na(threshold) & useQueryCalculator == 'true' & threshold < resultSize),
                       c("responseTime"),  # summarize vars
                       c("queryFile", "terminateEarly", "threshold") # group by
    )
  
  
  for(q in unique(df_calc_vs_early$queryFile)){
    # grab data for a specific query file
    d <- dplyr::filter(df_calc_vs_early, grepl(paste("^", q, sep=""), queryFile))
    # update title
    title <- gsub("\\.graphql$", "", q)
    p <-
      ggplot(data=d, aes(x=threshold, y=responseTime_mean, fill=terminateEarly)) +
      geom_bar(stat="identity", color="black", position=position_dodge()) +
      geom_errorbar(aes(ymin=responseTime_mean-responseTime_sd, ymax=responseTime_mean+responseTime_sd), position=position_dodge()) +
      ggtitle(paste("Query:", title)) +
      labs(y="Response Time (ms)", x="Threshold") +
      scale_fill_discrete(labels = c("Calculator", "Early Termination")) +
      theme(legend.title=element_blank())
    #scale_y_continuous(expand = c(0, 0), limits=c(0, max(d$responseTime_mean + d$responseTime_sd)*1.1))
    
    print(p)
    ggsave(paste("plots/ResponseTime/EarlyTermination/", title, ".pdf", sep=""), p)
  }
}
calculator_vs_early_termination_above_threshold()
calculator_vs_early_termination_above_threshold_result_size <- function(){
  df_result_size <-
    data_summary_multi(filter(df, !is.na(threshold) & threshold < resultSize),
                       c("resultSize"),  # summarize vars
                       c("queryFile", "threshold", "terminateEarly") # group by
    )
  ### Plot result size with respect to threshold (if threshold < result size) ###
  for(q in unique(df_result_size$queryFile)){
    # grab data for a specific query file
    d <- dplyr::filter(df_result_size, grepl(paste("^", q, sep=""), queryFile))
    # update title
    title <- gsub("\\.graphql$", "", q)
    p <-
      ggplot(data=d, aes(x=threshold, y=resultSize_mean, fill=terminateEarly)) +
      geom_bar(stat="identity", color="black", position=position_dodge()) +
      geom_errorbar(aes(ymin=resultSize_mean-resultSize_sd, ymax=resultSize_mean+resultSize_sd), position=position_dodge()) +
      ggtitle(paste("Query:", title)) +
      labs(y="Result Size", x="Threshold") +
      scale_fill_discrete(labels = c("Calculate", "Early Termination")) +
      theme(
        legend.title=element_blank()
      ) +
      scale_y_continuous(labels = ks) +
      geom_errorbar(aes(ymax=threshold, ymin=threshold), linetype="solid", color = "black", size = 0.5)
    print(p)
    ggsave(paste("plots/ResultSize/Linear/", title, ".pdf", sep=""), p)
  }
}
calculator_vs_early_termination_above_threshold_result_size()
calculator_vs_early_termination_above_threshold_result_size_log <- function(){
  df_result_size <-
    data_summary_multi(filter(df, !is.na(threshold) & threshold < resultSize),
                       c("resultSize"),  # summarize vars
                       c("queryFile", "threshold", "terminateEarly") # group by
    )
  ### Plot result size with respect to threshold (if threshold < result size) ###
  for(q in unique(df_result_size$queryFile)){
    # grab data for a specific query file
    d <- dplyr::filter(df_result_size, grepl(paste("^", q, sep=""), queryFile))
    
    # update title
    title <- gsub("\\.graphql$", "", q)
    p <-
      ggplot(data=d, aes(x=threshold, y=resultSize_mean, fill=terminateEarly)) +
      geom_bar(stat="identity", color="black", position=position_dodge()) +
      geom_errorbar(aes(ymin=resultSize_mean-resultSize_sd, ymax=resultSize_mean+resultSize_sd), position=position_dodge()) +
      ggtitle(paste("Query:", title)) +
      labs(y="Result Size (log 10)", x="Threshold") +
      scale_fill_discrete(labels = c("Calculate", "Early Termination")) +
      theme(
        legend.title=element_blank()
      ) +
      scale_y_continuous(trans='log10') +
      geom_errorbar(aes(ymax=threshold, ymin=threshold), linetype="solid", color = "black", size = .5)
    
    print(p)
    ggsave(paste("plots/ResultSize/Log10/", title, ".pdf", sep=""), p)
  }
}
calculator_vs_early_termination_above_threshold_result_size_log()
early_termination_split_time <- function(){
  ### Plot queries and thresholds where the caluclating executor has been waiting for promises ###
  df_early_split_time <-
    data_summary_multi(filter(df, !is.na(threshold) & terminateEarly == 'true' & !is.na(waitingOnPromises)),
                       c("calculationTime", "resultTime", "waitingOnPromises"),  # summarize vars
                       c("queryFile", "threshold") # group by
    )
  # slice out relevant columns into d1 and d2
  d1 <-df_early_split_time
  d1$Time <- d1$waitingOnPromises_mean
  d1$Type <- 'Waiting'
  d2 <- df_early_split_time
  d2$Time <- d2$calculationTime_mean - d2$waitingOnPromises_mean
  d2$Type <- 'Calculation'
  d3 <- rbind(d1, d2)
  print(d3)
  for(q in unique(df_early_split_time$queryFile)){
    # grab data for a specific query file
    d <- dplyr::filter(d3, grepl(paste("^", q, sep=""), queryFile))
    # update title
    title <- gsub("\\.graphql$", "", q)
    p <-
      ggplot(data=d, aes(x=threshold, y=Time, fill=Type)) +
      geom_bar(stat="identity", color="black") +
      ggtitle(paste("Query:", title)) +
      labs(y="Time (ms)", x="Threshold") +
      theme(legend.title=element_blank())
    
    print(p)
    ggsave(paste("plots/WastedTime/", title, ".pdf", sep=""), p)
  }
}
early_termination_split_time()

df_result_size <-
  data_summary_multi(filter(df, !is.na(threshold)),
                     c("resultSize"),  # summarize vars
                     c("queryFile", "threshold", "terminateEarly") # group by
  )

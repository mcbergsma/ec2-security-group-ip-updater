# ec2-security-group-ip-updater

Update AWS EC2 Security Groups to your current IP. Checks all your security groups in AWS and finds matches based on the description, it will then replace them with the public IP of the machine you run the script on.

For example, if you fill in the description as `Mike@Home` on each of the rules for your Home IP address across all security groups, the script will find all occurences and update them.

## Usage

Clone this repo and run `npm install`

Create an AWS IAM Policy with the following permissions and assign it to a new or existing IAM User.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor0",
      "Effect": "Allow",
      "Action": [
        "ec2:RevokeSecurityGroupIngress",
        "ec2:AuthorizeSecurityGroupEgress",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:DescribeSecurityGroupReferences",
        "ec2:RevokeSecurityGroupEgress",
        "ec2:DeleteSecurityGroup",
        "ec2:DescribeSecurityGroups"
      ],
      "Resource": "*"
    }
  ]
}
```

Rename `Sample.env` to `.env` and update the variables as required.

Update the values below with your AWS credentials and region.

```json
AWSREGION=YOURDATAHERE
AWSACCESSKEYID=YOURDATAHERE
AWSSECRETACCESSKEY=YOURDATAHERE
```

All the rules you want updated should have the same description so they can be found every time. IE: `Mike@Home`. Update the `.env` file to match your description.

```
RULEDESCRIPTION=Mike@Home
```

The script will use a file to store the last known version of your IP address, as well as a logging file to keep track of changes over time. The filesnames do not need to be modified, but they can be.

```
RECENTIPFILENAME=recent.ip
LOGFILENAME=update.log
```

## Additional Usages

This was created to run in _Windows Task Scheduler_, the following set-up works fairly well.

**General**: Select the option _Run whether user is logged in or not_

**Triggers**: _At Startup_ and _Daily: A 12PM Every Day, Repeat task every 30 minutes for a duration of 1 day._

**Actions**: Start a Program. Set the _Program/Script_ to `npm`. Set the _Add Arguments_ to `start` and set the _Start In_ to the folder you cloned the script into.

That should be it - tweak as needed to meet your use case.

## Node Version

This was tested as low as `Node v7.7.4`.
